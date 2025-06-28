using System.Data;
using Application.ChatRoomRoles.DTOs;
using Application.Interfaces;
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

        await EnsureChatRoomExistsAsync(chatRoomId);

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

    public async Task<ChatRoomRoleDto> CreateCustomRoleAsync(CreateChatRoomRoleDto createRoleDto)
    {
        await EnsureChatRoomExistsAsync(createRoleDto.ChatRoomId);

        if (await context.ChatRoomRoles.AnyAsync(crr => crr.ChatRoomId == createRoleDto.ChatRoomId &&
            crr.Name == createRoleDto.Name))
            throw new ArgumentException($"ChatRoom with id {createRoleDto.ChatRoomId}" +
                $"already contains role named {createRoleDto.Name}");

        var chatRoomRole = new ChatRoomRole
        {
            Name = createRoleDto.Name,
            Color = createRoleDto.Color,
            Description = createRoleDto.Description,
            IsDefault = false,
            ChatRoomId = createRoleDto.ChatRoomId
        };

        await context.ChatRoomRoles.AddAsync(chatRoomRole);

        var saved = await context.SaveChangesAsync() > 0;
        if (!saved)
            throw new Exception("Failed to create chat room role. Database save operation did not succeed.");

        return new ChatRoomRoleDto
        {
            Id = chatRoomRole.Id,
            Name = chatRoomRole.Name,
            Color = chatRoomRole.Color,
            Description = chatRoomRole.Description,
            IsDefault = chatRoomRole.IsDefault,
            CreatedAt = chatRoomRole.CreatedAt,
            ChatRoomId = chatRoomRole.ChatRoomId,
        };
    }

    public async Task<List<ChatRoomRoleDto>> GetRolesAsync(string chatRoomId)
    {
        await EnsureChatRoomExistsAsync(chatRoomId);

        var roles = await context.ChatRoomRoles
            .Where(crr => crr.ChatRoomId == chatRoomId)
            .Select(crr => new ChatRoomRoleDto
            {
                Id = crr.Id,
                Name = crr.Name,
                Color = crr.Color,
                Description = crr.Description,
                IsDefault = crr.IsDefault,
                CreatedAt = crr.CreatedAt,
                ChatRoomId = crr.ChatRoomId
            })
            .ToListAsync();

        return roles;
    }
    public async Task<List<ChatRoomRoleDto>> GetRolesAsync(string chatRoomId, string userId)
    {
        await EnsureChatRoomExistsAsync(chatRoomId);

        if (!await context.Users.AnyAsync(u => u.Id == userId))
            throw new NoNullAllowedException($"User with id {userId} does not exist");

        var roles = await context.ChatRoomMemberRoles
            .Where(mr => mr.ChatRoomId == chatRoomId && mr.UserId == userId)
            .Include(mr => mr.Role)
            .Select(mr => new ChatRoomRoleDto
            {
                Id = mr.Role.Id,
                Name = mr.Role.Name,
                Color = mr.Role.Color,
                Description = mr.Role.Description,
                IsDefault = mr.Role.IsDefault,
                CreatedAt = mr.Role.CreatedAt,
                ChatRoomId = mr.ChatRoomId
            })
            .ToListAsync();

        return roles;
    }

    public async Task UpdateRoleAsync(UpdateChatRoomRoleDto updateRoleDto)
    {
        var chatRoomRole = await context.ChatRoomRoles
            .FirstOrDefaultAsync(crr => crr.Id == updateRoleDto.Id)
            ?? throw new NoNullAllowedException($"ChatRoomRole with id {updateRoleDto.Id} does not exist");

        if (updateRoleDto.Name != null)
        {
            chatRoomRole.Name = updateRoleDto.Name;
        }
        if (updateRoleDto.Description != null)
        {
            chatRoomRole.Description = updateRoleDto.Description;
        }
        if (updateRoleDto.Color != null)
        {
            chatRoomRole.Color = updateRoleDto.Color;
        }

        // We assume that role already has all implemented permissions
        foreach (var permission in updateRoleDto.Permissions)
        {
            var existingPermission = await context.ChatRoomRolePermissions
                .FirstOrDefaultAsync(crp => crp.RoleId == chatRoomRole.Id && crp.PermissionId == permission.Id);

            if (existingPermission != null)
            {
                existingPermission.IsAllowed = permission.IsAllowed;
            }
        }

        await context.SaveChangesAsync();
    }

    public async Task DeleteRoleAsync(string chatRoomRoleId)
    {
        if (!await context.ChatRoomRoles.AnyAsync(crr => crr.Id == chatRoomRoleId))
            throw new NoNullAllowedException($"ChatRoomRole with id {chatRoomRoleId} does not exist");

        var chatRoomRole = await context.ChatRoomRoles
            .FirstAsync(crr => crr.Id == chatRoomRoleId);

        if (chatRoomRole.IsDefault)
            throw new InvalidOperationException("Cannot delete a default role");

        context.ChatRoomRoles.Remove(chatRoomRole);

        await context.SaveChangesAsync();
    }

    public async Task<bool> IsDefaultRoleAsync(string chatRoomRoleId)
    {
        return await context.ChatRoomRoles
            .Where(crr => crr.Id == chatRoomRoleId)
            .Select(crr => crr.IsDefault)
            .FirstOrDefaultAsync();
    }

    public async Task<MemberRoleDto> AssignRoleAsync(AssignChatRoomRoleDto assignRoleDto)
    {
        await EnsureChatRoomExistsAsync(assignRoleDto.ChatRoomId);

        if (!await context.Users.AnyAsync(u => u.Id == assignRoleDto.UserId))
            throw new NoNullAllowedException($"User with id {assignRoleDto.UserId} does not exist");

        var chatRoomRole = await context.ChatRoomRoles
            .FirstOrDefaultAsync(crr => crr.Id == assignRoleDto.Id && crr.ChatRoomId == assignRoleDto.ChatRoomId)
            ?? throw new NoNullAllowedException($"ChatRoomRole with id {assignRoleDto.Id}" +
            $"does not exist in chatroom {assignRoleDto.ChatRoomId}");

        if (await context.ChatRoomMemberRoles.CountAsync(mr =>
            mr.RoleId == assignRoleDto.Id &&
            mr.ChatRoomId == assignRoleDto.ChatRoomId &&
            mr.UserId == assignRoleDto.UserId) == 1)
            throw new InvalidOperationException($"User {assignRoleDto.UserId} already has role" +
            $"{assignRoleDto.Id} in chatroom {assignRoleDto.ChatRoomId}");

        var chatRoomMemberRole = new ChatRoomMemberRole
        {
            UserId = assignRoleDto.UserId,
            ChatRoomId = assignRoleDto.ChatRoomId,
            RoleId = chatRoomRole.Id,
            AssignedById = assignRoleDto.AssignedById
        };

        context.ChatRoomMemberRoles.Add(chatRoomMemberRole);

        await context.SaveChangesAsync();

        return new MemberRoleDto
        {
            UserId = chatRoomMemberRole.UserId,
            ChatRoomId = chatRoomMemberRole.ChatRoomId,
            RoleId = chatRoomMemberRole.RoleId,
            RoleName = chatRoomRole.Name,
            AssignedAt = chatRoomMemberRole.AssignedAt,
            AssignedBy = chatRoomMemberRole.AssignedById
        };
    }

    public async Task AssignMemberRoleAsync(string userId, string chatRoomId)
    {
        if (!await context.Users.AnyAsync(u => u.Id == userId))
            throw new NoNullAllowedException($"User with id {userId} does not exist");

        await EnsureChatRoomExistsAsync(chatRoomId);

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

    public async Task UnassignRoleAsync(UnassignChatRoomRoleDto unassignRoleDto)
    {
        await EnsureChatRoomExistsAsync(unassignRoleDto.ChatRoomId);

        if (!await context.Users.AnyAsync(u => u.Id == unassignRoleDto.UserId))
            throw new NoNullAllowedException($"User with id {unassignRoleDto.UserId} does not exist");

        var chatRoomMemberRole = await context.ChatRoomMemberRoles
            .Where(mr => mr.UserId == unassignRoleDto.UserId &&
                                       mr.ChatRoomId == unassignRoleDto.ChatRoomId &&
                                       mr.RoleId == unassignRoleDto.Id)
            .ExecuteDeleteAsync();

    }
    
    private async Task EnsureChatRoomExistsAsync(string chatRoomId)
    {
        if (!await context.ChatRooms.AnyAsync(cr => cr.Id == chatRoomId))
            throw new NoNullAllowedException($"ChatRoom with id {chatRoomId} does not exist");
    }
}
