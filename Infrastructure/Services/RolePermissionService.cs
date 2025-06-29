using System.Data;
using Application.ChatRoomRoles.DTOs;
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
            }).ToList();

        context.ChatRoomPermissions.AddRange(permissions);

        await context.SaveChangesAsync();
    }

    public async Task<List<ChatRoomRolePermissionDto>> CreatePermissionsAsync(string roleId)
    {
        if (!await context.ChatRoomRoles.AnyAsync(r => r.Id == roleId))
            throw new ArgumentException($"Role with ID {roleId} does not exist.");

        var permissions = await context.ChatRoomPermissions.ToListAsync()
            ?? throw new NoNullAllowedException("No permissions found in the database.");

        var rolePermissionsDtos = permissions.Select(p => new ChatRoomRolePermissionDto
        {
            RoleId = roleId,
            Permission = new ChatRoomPermissionDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
            },
            IsAllowed = false,
        }).ToList();

        var rolePermissions = rolePermissionsDtos.Select(dto => new ChatRoomRolePermission
        {
            RoleId = dto.RoleId,
            PermissionId = dto.Permission.Id,
            IsAllowed = dto.IsAllowed,
        }).ToList();

        context.ChatRoomRolePermissions.AddRange(rolePermissions);

        var saved = await context.SaveChangesAsync() > 0;
        if (!saved)
            throw new Exception("Failed to create chat room role. Database save operation did not succeed.");

        return rolePermissionsDtos;
    }

    public async Task<List<ChatRoomRolePermissionDto>> GetPermissionsAsync(string roleId)
    {
        if (!await context.ChatRoomRoles.AnyAsync(r => r.Id == roleId))
            throw new ArgumentException($"Role with ID {roleId} does not exist.");

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
            }).ToListAsync();
    }

    public async Task<List<ChatRoomPermissionDto>> GetUserPermissionsAsync(string userId, string chatRoomId)
    {
        var chatRoom = await context.ChatRooms.FirstOrDefaultAsync(cr => cr.Id == chatRoomId);
        if (chatRoom?.OwnerId == userId)
            return await context.ChatRoomPermissions
                .Select(p => new ChatRoomPermissionDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description
                }).ToListAsync();

        return await context.ChatRoomMemberRoles
            .Where(mr => mr.UserId == userId && mr.ChatRoomId == chatRoomId)
            .SelectMany(mr => mr.Role.RolePermissions)
            .Where(rp => rp.IsAllowed)
            .DistinctBy(rp => rp.PermissionId)
            .Select(rp => new ChatRoomPermissionDto
            {
                Id = rp.Permission.Id,
                Name = rp.Permission.Name,
                Description = rp.Permission.Description
            }).ToListAsync();
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
        if (!await context.ChatRoomRoles.AnyAsync(r => r.Id == roleId))
        throw new ArgumentException($"Role with ID {roleId} does not exist.");

        var permissionIds = changeRolePermissionDtos.Select(x => x.Id).ToList();

        var rolePermissions = await context.ChatRoomRolePermissions
            .Where(rp => rp.RoleId == roleId && permissionIds.Contains(rp.PermissionId))
            .ToListAsync();

        if (rolePermissions.Count != permissionIds.Count)
            throw new ArgumentException("One or more permissions do not exist for this role.");

        foreach (var changePermissionDto in changeRolePermissionDtos)
        {
            var rolePermission = rolePermissions
                .First(rp => rp.PermissionId == changePermissionDto.Id);

            rolePermission.IsAllowed = changePermissionDto.IsAllowed;
        }

        await context.SaveChangesAsync();
    }
}
