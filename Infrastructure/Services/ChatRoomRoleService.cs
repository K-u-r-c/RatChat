using System;
using System.Collections.Generic;

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

        if (await context.ChatRoomRoles.AnyAsync(r => r.ChatRoomId == chatRoomId))
            return;

        var storedPermissions = await context.ChatRoomPermissions.ToListAsync();

        if (storedPermissions.Count == 0)
            throw new ChatRoomPermissionsNotFoundException("No permissions to initiate roles in the given context");

        var roles = ChatRoomRoles.Defaults
            .Select((r, index) => new ChatRoomRole
            {
                Name = r.Key,
                Description = r.Value.Description,
                Color = r.Value.Color,
                IsDefault = true,
                ChatRoomId = chatRoomId,
                Importance = index
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

        var nextImportance = (await context.ChatRoomRoles
            .Where(crr => crr.ChatRoomId == createRoleDto.ChatRoomId)
            .Select(crr => (int?)crr.Importance)
            .MaxAsync() ?? -1) + 1;

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
            Importance = chatRoomRole.Importance,
            IsDisplayRole = false
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
                ChatRoomId = crr.ChatRoomId,
                Importance = crr.Importance,
                IsDisplayRole = false
            })
            .FirstAsync();

        return chatRoomRole;
    }

    public async Task<List<ChatRoomRoleDto>> GetRolesAsync(string chatRoomId)
    {
        await EnsureChatRoomExistsAsync(chatRoomId);

        var roles = await context.ChatRoomRoles
            .Where(crr => crr.ChatRoomId == chatRoomId)
            .OrderBy(crr => crr.Importance)
            .Select(crr => new ChatRoomRoleDto
            {
                Id = crr.Id,
                Name = crr.Name,
                Color = crr.Color,
                Description = crr.Description,
                IsDefault = crr.IsDefault,
                CreatedAt = crr.CreatedAt,
                ChatRoomId = crr.ChatRoomId,
                Importance = crr.Importance,
                IsDisplayRole = false
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
            .OrderBy(mr => mr.Role.Importance)
            .Select(mr => new ChatRoomRoleDto
            {
                Id = mr.Role.Id,
                Name = mr.Role.Name,
                Color = mr.Role.Color,
                Description = mr.Role.Description,
                IsDefault = mr.Role.IsDefault,
                CreatedAt = mr.Role.CreatedAt,
                ChatRoomId = mr.ChatRoomId,
                IsDisplayRole = false
            })
            .ToListAsync();

        var preferredRoleId = await context.ChatRoomMembers
            .Where(m => m.ChatRoomId == chatRoomId && m.UserId == userId)
            .Select(m => m.DisplayRoleId)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrEmpty(preferredRoleId))
        {
            foreach (var role in roles)
            {
                role.IsDisplayRole = role.Id == preferredRoleId;
            }
        }

        return roles;
    }

    public async Task<Dictionary<string, List<ChatRoomRoleDto>>> GetUsersRolesAsync(string chatRoomId)
    {
        await EnsureChatRoomExistsAsync(chatRoomId);

        var displayRoleAssignments = await context.ChatRoomMembers
            .Where(m => m.ChatRoomId == chatRoomId && m.DisplayRoleId != null && m.UserId != null)
            .Select(m => new { m.UserId, m.DisplayRoleId })
            .ToListAsync();

        var displayRoleMap = new Dictionary<string, string>();
        foreach (var assignment in displayRoleAssignments)
        {
            if (assignment.UserId != null && assignment.DisplayRoleId != null)
            {
                displayRoleMap[assignment.UserId] = assignment.DisplayRoleId;
            }
        }

        var memberRoles = await context.ChatRoomMemberRoles
            .Where(mr => mr.ChatRoomId == chatRoomId)
            .Include(mr => mr.Role)
            .OrderBy(mr => mr.Role.Importance)
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
                    ChatRoomId = mr.ChatRoomId,
                    Importance = mr.Role.Importance
                }
            })
            .ToListAsync();

        foreach (var entry in memberRoles)
        {
            if (entry.UserId != null &&
                displayRoleMap.TryGetValue(entry.UserId, out var preferredRoleId) &&
                preferredRoleId == entry.Role.Id)
            {
                entry.Role.IsDisplayRole = true;
            }
        }

        return memberRoles
            .GroupBy(x => x.UserId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(x => x.Role)
                    .OrderByDescending(r => r.IsDisplayRole)
                    .ThenBy(r => r.Importance)
                    .ThenBy(r => r.CreatedAt)
                    .ToList());
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

        if (context.ChangeTracker.HasChanges())
        {
            await context.SaveChangesAsync();
        }
    }

    public async Task DeleteRoleAsync(string chatRoomRoleId)
    {
        await EnsureRoleExistsAsync(chatRoomRoleId);

        var chatRoomRole = await context.ChatRoomRoles
            .FirstAsync(crr => crr.Id == chatRoomRoleId);

        if (chatRoomRole.IsDefault)
            throw new CannotDeleteDefaultRoleException("Cannot delete a default role");

        var displayMembers = await context.ChatRoomMembers
            .Where(m => m.ChatRoomId == chatRoomRole.ChatRoomId && m.DisplayRoleId == chatRoomRoleId)
            .ToListAsync();

        foreach (var member in displayMembers)
        {
            member.DisplayRoleId = null;
        }

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
                ChatRoomId = chatRoomRole.ChatRoomId,
                Importance = chatRoomRole.Importance,
                IsDisplayRole = false
            },
        };
    }

    public async Task<MemberDisplayRoleDto> SetMemberDisplayRoleAsync(SetMemberDisplayRoleDto dto)
    {
        await EnsureChatRoomExistsAsync(dto.ChatRoomId);
        await EnsureUserExistsAsync(dto.UserId);

        var member = await context.ChatRoomMembers
            .FirstOrDefaultAsync(m => m.ChatRoomId == dto.ChatRoomId && m.UserId == dto.UserId)
            ?? throw new ChatRoomMemberNotFoundException($"User {dto.UserId} is not a member of chat room {dto.ChatRoomId}");

        string? effectiveRoleId = null;

        if (!string.IsNullOrEmpty(dto.RoleId))
        {
            await EnsureRoleExistsAsync(dto.RoleId);

            var roleChatRoomId = await context.ChatRoomRoles
                .Where(r => r.Id == dto.RoleId)
                .Select(r => r.ChatRoomId)
                .FirstAsync();

            if (roleChatRoomId != dto.ChatRoomId)
            {
                throw new ChatRoomRoleNotFoundException($"Role {dto.RoleId} does not belong to chat room {dto.ChatRoomId}");
            }

            var hasRole = await context.ChatRoomMemberRoles
                .AnyAsync(mr =>
                    mr.ChatRoomId == dto.ChatRoomId &&
                    mr.UserId == dto.UserId &&
                    mr.RoleId == dto.RoleId);

            if (!hasRole)
            {
                throw new UserDoesNotHaveRoleException($"User {dto.UserId} does not have role {dto.RoleId} in chat room {dto.ChatRoomId}");
            }

            effectiveRoleId = dto.RoleId;
        }

        member.DisplayRoleId = effectiveRoleId;

        await context.SaveChangesAsync();

        return new MemberDisplayRoleDto
        {
            UserId = dto.UserId,
            RoleId = effectiveRoleId
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

        var membership = await context.ChatRoomMemberRoles
            .Where(mr => mr.UserId == unassignRoleDto.UserId && mr.RoleId == unassignRoleDto.Id)
            .Select(mr => new { mr.ChatRoomId })
            .FirstOrDefaultAsync();

        await context.ChatRoomMemberRoles
            .Where(mr => mr.UserId == unassignRoleDto.UserId &&
                                       mr.RoleId == unassignRoleDto.Id)
            .ExecuteDeleteAsync();

        if (membership != null)
        {
            var member = await context.ChatRoomMembers
                .FirstOrDefaultAsync(m => m.ChatRoomId == membership.ChatRoomId && m.UserId == unassignRoleDto.UserId);

            if (member != null && member.DisplayRoleId == unassignRoleDto.Id)
            {
                member.DisplayRoleId = null;
                await context.SaveChangesAsync();
            }
        }

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


    public async Task<List<ChatRoomRoleDto>> ReorderRolesAsync(string chatRoomId, IReadOnlyList<string> orderedRoleIds)
    {
        await EnsureChatRoomExistsAsync(chatRoomId);

        if (orderedRoleIds == null || orderedRoleIds.Count == 0)
        {
            throw new ArgumentException("You must provide at least one role id to reorder.", nameof(orderedRoleIds));
        }

        var roles = await context.ChatRoomRoles
            .Where(r => r.ChatRoomId == chatRoomId)
            .ToListAsync();

        if (roles.Count == 0)
        {
            return new List<ChatRoomRoleDto>();
        }

        var existingIds = roles.Select(r => r.Id).ToHashSet();
        var providedIds = orderedRoleIds.ToHashSet();

        if (providedIds.Count != orderedRoleIds.Count)
        {
            throw new ArgumentException("Role ids must be unique.", nameof(orderedRoleIds));
        }

        var unknownIds = providedIds.Except(existingIds).ToList();
        if (unknownIds.Count > 0)
        {
            throw new ChatRoomRoleNotFoundException($"Some roles do not belong to chat room {chatRoomId}: {string.Join(", ", unknownIds)}");
        }

        var missingIds = existingIds.Except(providedIds).ToList();

        var orderedList = new List<ChatRoomRole>();
        var position = 0;
        foreach (var roleId in orderedRoleIds)
        {
            var role = roles.First(r => r.Id == roleId);
            role.Importance = position++;
            orderedList.Add(role);
        }

        if (missingIds.Count > 0)
        {
            foreach (var role in roles
                         .Where(r => missingIds.Contains(r.Id))
                         .OrderBy(r => r.Importance))
            {
                role.Importance = position++;
                orderedList.Add(role);
            }
        }

        await context.SaveChangesAsync();

        return orderedList
            .OrderBy(r => r.Importance)
            .Select(r => new ChatRoomRoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Color = r.Color,
                Description = r.Description,
                IsDefault = r.IsDefault,
                CreatedAt = r.CreatedAt,
                ChatRoomId = r.ChatRoomId,
                Importance = r.Importance,
                IsDisplayRole = false
            })
            .ToList();
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


