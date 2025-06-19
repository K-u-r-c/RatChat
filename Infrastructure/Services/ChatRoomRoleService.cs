using System.Data;
using Application.Interfaces;
using Application.Roles.DTOs;
using Domain;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Infrastructure.Services;

public class ChatRoomRoleService(AppDbContext context) : IChatRoomRoleService
{
    public async Task InitializeDefaultRolesAsync(string chatRoomId)
    {
        var storedPermissions = await context.ChatRoomPermissions.ToListAsync();

        if (storedPermissions.Count == 0)
            throw new NoNullAllowedException("No permissions to initiate roles in the given context");

        if (!await context.ChatRooms.AnyAsync(cr => cr.Id == chatRoomId))
            throw new NoNullAllowedException($"There is no chatroom with id {chatRoomId}");

        var roles = ChatRoomRoles.Defaults
            .Select(r => new ChatRoomRole
            {
                Name = r.Key,
                Description = r.Value.Description,
                Color = r.Value.Color,
                IsDefault = true,
                ChatRoomId = chatRoomId
            }).ToList();

        context.ChatRoomRoles.AddRange(roles);

        var rolePermissions = roles
            .SelectMany(r => storedPermissions.Select(p =>
            new ChatRoomRolePermission
            {
                RoleId = r.Id,
                PermissionId = p.Id,
                IsAllowed = ChatRoomRoles.DefaultsPermissions.TryGetValue(
                (r.Name, p.Name), out var allowed) && allowed
            }))
            .ToList();

        context.ChatRoomRolePermissions.AddRange(rolePermissions);

        await context.SaveChangesAsync();
    }

    public async Task AssignMemberRoleAsync(string userId, string chatRoomId)
    {
        if (!await context.Users.AnyAsync(u => u.Id == userId))
            throw new NoNullAllowedException($"User with id {userId} does not exist");

        if (!await context.ChatRooms.AnyAsync(cr => cr.Id == chatRoomId))
            throw new NoNullAllowedException($"ChatRoom with id {chatRoomId} does not exist");

        var memberRole = await context.ChatRoomRoles
            .FirstAsync(r => r.ChatRoomId == chatRoomId && r.Name == ChatRoomRoles.Member)
            ?? throw new NoNullAllowedException($"No Member role found for this chatroom {chatRoomId}");

        var chatroomMemberRole = new ChatRoomMemberRole
        {
            UserId = userId,
            ChatRoomId = chatRoomId,
            RoleId = memberRole.Id
        };

        context.ChatRoomMemberRoles.Add(chatroomMemberRole);

        await context.SaveChangesAsync();
    }

    public Task<bool> CreateRoleAsync(ChatRoomRoleDto chatRoomRoleDto, string chatRoomId)
    {
        throw new NotImplementedException();
    }

    public Task<bool> DeleteRoleAsync(string chatRoomRoleId)
    {
        throw new NotImplementedException();
    }
}
