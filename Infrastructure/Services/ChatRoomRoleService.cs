using System.Data;
using Application.ChatRoomRoles.DTOs;
using Application.Core;
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
        await EnsureChatRoomExistsAsync(chatRoomId);

        var storedPermissions = await context.ChatRoomPermissions.ToListAsync();

        if (storedPermissions.Count == 0)
            throw new ChatRoomPermissionsNotFoundException("No permissions to initiate roles in the given context");

        var roles = ChatRoomRoles.Defaults
            .Select(r => new ChatRoomRole
            {
                Name = r.Key,
                Description = r.Value.Description,
                Color = r.Value.Color,
                IsDefault = true,
                ChatRoomId = chatRoomId
            })
            .ToList();

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
            throw new ChatRoomRoleAlreadyExistsException($"ChatRoom with id {createRoleDto.ChatRoomId}" +
                $" already contains role named {createRoleDto.Name}");

        var chatRoomRole = new ChatRoomRole
        {
            Name = createRoleDto.Name,
            Description = createRoleDto.Description,
            Color = createRoleDto.Color,
            IsDefault = false,
            ChatRoomId = createRoleDto.ChatRoomId
        };

        await context.ChatRoomRoles.AddAsync(chatRoomRole);

        var saved = await context.SaveChangesAsync() > 0;
        if (!saved)
            throw new ContextSaveOperationFailedException("Failed to create chat room role. " +
            "Database save operation did not succeed.");

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

    public async Task<ChatRoomRoleDto> GetRoleAsync(string roleId)
    {
        await EnsureRoleExistsAsync(roleId);

        var chatRoomRole = await context.ChatRoomRoles
            .Where(crr => crr.Id == roleId)
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
            .FirstAsync();

        return chatRoomRole;
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
        await EnsureUserExistsAsync(userId);

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

    public async Task<Dictionary<string, List<ChatRoomRoleDto>>> GetUsersRolesAsync(string chatRoomId)
    {
        await EnsureChatRoomExistsAsync(chatRoomId);

        var memberRoles = await context.ChatRoomMemberRoles
            .Where(mr => mr.ChatRoomId == chatRoomId)
            .Include(mr => mr.Role)
            .Select(mr => new
            {
                UserId = mr.UserId,
                Role = new ChatRoomRoleDto
                {
                    Id = mr.Role.Id,
                    Name = mr.Role.Name,
                    Color = mr.Role.Color,
                    Description = mr.Role.Description,
                    IsDefault = mr.Role.IsDefault,
                    CreatedAt = mr.Role.CreatedAt,
                    ChatRoomId = mr.ChatRoomId
                }
            })
            .ToListAsync();

        return memberRoles
            .GroupBy(x => x.UserId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Role).ToList());
    }

    public async Task UpdateRoleAsync(UpdateChatRoomRoleDto updateRoleDto)
    {
        var chatRoomRole = await context.ChatRoomRoles
            .FirstOrDefaultAsync(crr => crr.Id == updateRoleDto.Id)
            ?? throw new ChatRoomRoleNotFoundException($"ChatRoomRole with id {updateRoleDto.Id} does not exist");

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
                .FirstOrDefaultAsync(rp => rp.RoleId == chatRoomRole.Id && rp.PermissionId == permission.Id);

            if (existingPermission != null)
            {
                existingPermission.IsAllowed = permission.IsAllowed;
            }
        }

        var saved = await context.SaveChangesAsync() > 0;
        if (!saved)
            throw new ContextSaveOperationFailedException("Failed to update chat room role. " +
            "Database save operation did not succeed.");
    }

    public async Task DeleteRoleAsync(string chatRoomRoleId)
    {
        await EnsureRoleExistsAsync(chatRoomRoleId);

        var chatRoomRole = await context.ChatRoomRoles
            .FirstAsync(crr => crr.Id == chatRoomRoleId);

        if (chatRoomRole.IsDefault)
            throw new CannotDeleteDefaultRoleException("Cannot delete a default role");

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

    public async Task<AssignedChatRoomRoleDto> AssignRoleAsync(AssignChatRoomRoleDto assignRoleDto)
    {
        await EnsureUserExistsAsync(assignRoleDto.UserId);

        if (assignRoleDto.AssignedById != null)
            await EnsureUserExistsAsync(assignRoleDto.AssignedById);

        var chatRoomRole = await context.ChatRoomRoles
            .FirstOrDefaultAsync(crr => crr.Id == assignRoleDto.Id)
            ?? throw new ChatRoomRoleNotFoundException($"ChatRoomRole with id {assignRoleDto.Id} does not exist");

        if (await context.ChatRoomMemberRoles.CountAsync(mr =>
            mr.RoleId == assignRoleDto.Id &&
            mr.UserId == assignRoleDto.UserId) == 1)
            throw new UserAlreadyHasRoleException($"User {assignRoleDto.UserId} already" +
            $" has role {assignRoleDto.Id}");

        var chatRoomMemberRole = new ChatRoomMemberRole
        {
            UserId = assignRoleDto.UserId,
            ChatRoomId = chatRoomRole.ChatRoomId,
            RoleId = chatRoomRole.Id,
            AssignedById = assignRoleDto.AssignedById
        };

        context.ChatRoomMemberRoles.Add(chatRoomMemberRole);

        await context.SaveChangesAsync();

        return new AssignedChatRoomRoleDto
        {
            UserId = chatRoomMemberRole.UserId,
            Role = new ChatRoomRoleDto
            {
                Id = chatRoomRole.Id,
                Name = chatRoomRole.Name,
                Color = chatRoomRole.Color,
                Description = chatRoomRole.Description,
                IsDefault = chatRoomRole.IsDefault,
                CreatedAt = chatRoomRole.CreatedAt,
                ChatRoomId = chatRoomRole.ChatRoomId
            },
        };
    }

    public async Task AssignMemberRoleAsync(string userId, string chatRoomId, CancellationToken cancellationToken)
    {
        await EnsureUserExistsAsync(userId);
        await EnsureChatRoomExistsAsync(chatRoomId);

        var memberRole = await context.ChatRoomRoles
            .FirstAsync(r => r.ChatRoomId == chatRoomId && r.Name == ChatRoomRoles.Member,
            cancellationToken)
            ?? throw new ChatRoomRoleNotFoundException($"No Member role found for this chatroom {chatRoomId}");

        var chatroomMemberRole = new ChatRoomMemberRole
        {
            UserId = userId,
            ChatRoomId = chatRoomId,
            RoleId = memberRole.Id
        };

        context.ChatRoomMemberRoles.Add(chatroomMemberRole);

        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<UnassignedChatRoomRoleDto> UnassignRoleAsync(UnassignChatRoomRoleDto unassignRoleDto)
    {
        await EnsureUserExistsAsync(unassignRoleDto.UserId);
        await EnsureRoleExistsAsync(unassignRoleDto.Id);

        await context.ChatRoomMemberRoles
            .Where(mr => mr.UserId == unassignRoleDto.UserId &&
                                       mr.RoleId == unassignRoleDto.Id)
            .ExecuteDeleteAsync();

        return new UnassignedChatRoomRoleDto
        {
            Id = unassignRoleDto.Id,
            UserId = unassignRoleDto.UserId
        };
    }

    public async Task UnassignAllUserRolesAsync(string chatRoomId, string userId, CancellationToken cancellationToken)
    {
        await EnsureUserExistsAsync(userId);
        await EnsureChatRoomExistsAsync(chatRoomId);

        var rolesToRemove = await context.ChatRoomMemberRoles
                .Where(mr =>
                    mr.UserId == userId &&
                    mr.ChatRoomId == chatRoomId)
                .ToListAsync(cancellationToken);

        if (rolesToRemove.Count > 0)
            context.ChatRoomMemberRoles.RemoveRange(rolesToRemove);

        await context.SaveChangesAsync(cancellationToken);
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
