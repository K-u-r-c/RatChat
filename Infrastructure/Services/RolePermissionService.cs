using System.Data;
using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using Domain;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Infrastructure.Services;

public class RolePermissionService(AppDbContext context) : IRolePermissionService
{
    public async Task InitializePermissionsAsync()
    {
        if (await context.ChatRoomPermissions.AnyAsync())
            return;

        var permissions = ChatRoomPermissions.All
            .Select(p => new ChatRoomPermission
            {
                Name = p.Key,
                Description = p.Value,
            })
            .ToList();

        context.ChatRoomPermissions.AddRange(permissions);

        await context.SaveChangesAsync();
    }

    public async Task<List<ChatRoomRolePermissionDto>> CreatePermissionsAsync(string roleId)
    {
        await EnsureRoleExistsAsync(roleId);

        var permissions = await context.ChatRoomPermissions.ToListAsync()
            ?? throw new ChatRoomPermissionsNotFoundException("No permissions found in the database.");

        var rolePermissionsDtos = permissions
        .Select(p => new ChatRoomRolePermissionDto
        {
            RoleId = roleId,
            Permission = new ChatRoomPermissionDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
            },
            IsAllowed = false,
        })
        .ToList();

        var rolePermissions = rolePermissionsDtos
        .Select(dto => new ChatRoomRolePermission
        {
            RoleId = dto.RoleId,
            PermissionId = dto.Permission.Id,
            IsAllowed = dto.IsAllowed,
        })
        .ToList();

        context.ChatRoomRolePermissions.AddRange(rolePermissions);

        var saved = await context.SaveChangesAsync() > 0;
        if (!saved)
            throw new ContextSaveOperationFailedException("Failed to create chat room permissions." +
            " Database save operation did not succeed.");

        return rolePermissionsDtos;
    }

    public async Task<List<ChatRoomRolePermissionDto>> GetPermissionsAsync(string roleId)
    {
        await EnsureRoleExistsAsync(roleId);

        return await context.ChatRoomRolePermissions
            .Where(rp => rp.RoleId == roleId)
            .Select(rp => new ChatRoomRolePermissionDto
            {
                RoleId = rp.RoleId,
                Permission = new ChatRoomPermissionDto
                {
                    Id = rp.Permission.Id,
                    Name = rp.Permission.Name,
                    Description = rp.Permission.Description,
                },
                IsAllowed = rp.IsAllowed
            })
            .ToListAsync();
    }

    public async Task<List<ChatRoomPermissionDto>> GetUserPermissionsAsync(string userId, string chatRoomId)
    {
        await EnsureChatRoomExistsAsync(chatRoomId);
        await EnsureUserExistsAsync(userId);

        var chatRoom = await context.ChatRooms.FirstOrDefaultAsync(cr => cr.Id == chatRoomId);
        if (chatRoom?.OwnerId == userId)
            return await context.ChatRoomPermissions
                .Select(p => new ChatRoomPermissionDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description
                })
                .ToListAsync();

        return await context.ChatRoomMemberRoles
            .Where(mr => mr.UserId == userId && mr.ChatRoomId == chatRoomId)
            .SelectMany(mr => mr.Role.RolePermissions)
            .Where(rp => rp.IsAllowed)
            .Select(rp => new ChatRoomPermissionDto
            {
                Id = rp.Permission.Id,
                Name = rp.Permission.Name,
                Description = rp.Permission.Description
            })
            .Distinct()
            .ToListAsync();
    }

    public async Task<bool> CanSendMessagesAsync(string userId, string chatRoomId)
    {
        return await HasPermissionAsync(userId, chatRoomId, ChatRoomPermissions.SendMessages);
    }

    public async Task<bool> CanCreateInviteLinkAsync(string userId, string chatRoomId)
    {
        return await HasPermissionAsync(userId, chatRoomId, ChatRoomPermissions.CreateInviteLinks);
    }

    private async Task<bool> HasPermissionAsync(string userId, string chatRoomId, string permissionName)
    {
        await EnsureChatRoomExistsAsync(chatRoomId);
        await EnsureUserExistsAsync(userId);

        var chatRoom = await context.ChatRooms.FirstOrDefaultAsync(cr => cr.Id == chatRoomId);
        if (chatRoom?.OwnerId == userId)
            return true;

        return await context.ChatRoomMemberRoles
            .Where(mr => mr.UserId == userId && mr.ChatRoomId == chatRoomId)
            .SelectMany(mr => mr.Role.RolePermissions)
            .Where(rp => rp.Permission.Name == permissionName)
            .AnyAsync(rp => rp.IsAllowed);
    }

    public async Task ChangePermissionsAsync(string roleId, List<ChangeRolePermissionDto> changeRolePermissionDtos)
    {
        await EnsureRoleExistsAsync(roleId);

        var permissionIds = changeRolePermissionDtos.Select(x => x.Id).ToList();

        var rolePermissions = await context.ChatRoomRolePermissions
            .Where(rp => rp.RoleId == roleId && permissionIds.Contains(rp.PermissionId))
            .ToListAsync();

        if (rolePermissions.Count != permissionIds.Count)
            throw new ChatRoomRoleNotFoundException("One or more permissions do not exist for this role.");

        foreach (var changePermissionDto in changeRolePermissionDtos)
        {
            var rolePermission = rolePermissions
                .First(rp => rp.PermissionId == changePermissionDto.Id);

            rolePermission.IsAllowed = changePermissionDto.IsAllowed;
        }

        await context.SaveChangesAsync();
    }
    
    private async Task EnsureChatRoomExistsAsync(string chatRoomId)
    {
        if (!await context.ChatRooms.AnyAsync(cr => cr.Id == chatRoomId))
            throw new ChatRoomNotFoundException($"ChatRoom with id {chatRoomId} does not exist");
    }

    private async Task EnsureUserExistsAsync(string userId)
    {
        if (!await context.Users.AnyAsync(u => u.Id == userId))
            throw new UserNotFoundException($"User with id {userId} does not exist");
    }

    private async Task EnsureRoleExistsAsync(string roleId)
    {
        if (!await context.ChatRoomRoles.AnyAsync(r => r.Id == roleId))
            throw new ChatRoomRoleNotFoundException($"Role with ID {roleId} does not exist.");
    }
}
