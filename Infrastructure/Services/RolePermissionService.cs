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

    public async Task<bool> HasPermissionAsync(string userId, string chatRoomId, string permission)
    {
        var chatRoom = await context.ChatRooms.FirstOrDefaultAsync(cr => cr.Id == chatRoomId);
        if (chatRoom?.OwnerId == userId)
            return true;

        return await context.ChatRoomMemberRoles
            .Where(mr => mr.UserId == userId && mr.ChatRoomId == chatRoomId)
            .SelectMany(mr => mr.Role.RolePermissions)
            .Where(rp => rp.Permission.Name == permission)
            .AnyAsync(rp => rp.IsAllowed);
    }
    
    public async Task<List<string>> GetUserPermissionsAsync(string userId, string chatRoomId)
    {
        var chatRoom = await context.ChatRooms.FirstOrDefaultAsync(cr => cr.Id == chatRoomId);
        if (chatRoom?.OwnerId == userId)
            return [.. ChatRoomPermissions.All.Keys];

        return await context.ChatRoomMemberRoles
            .Where(mr => mr.UserId == userId && mr.ChatRoomId == chatRoomId)
            .SelectMany(mr => mr.Role.RolePermissions)
            .Where(rp => rp.IsAllowed)
            .Select(rp => rp.Permission.Name)
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

    public Task<bool> CanManageRoleAsync(string userId, string chatRoomId, string targetRoleId)
    {
        throw new NotImplementedException();
    }

    public Task<bool> CanManageUserAsync(string userId, string chatRoomId, string targetUserId)
    {
        throw new NotImplementedException();
    }
}
