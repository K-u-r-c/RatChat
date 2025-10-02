using Application.Interfaces;
using Domain;
using Microsoft.EntityFrameworkCore;
using Persistance;
using ChatRoomRoleDefaults = Domain.Enums.ChatRoomRoles;

namespace Application.Initialization;

public static class ProductionDbInitializer
{
    public static async Task SeedData(
        AppDbContext context,
        IRolePermissionService rolePermissionService,
        CancellationToken cancellationToken = default)
    {
        await rolePermissionService.InitializePermissionsAsync();

        await EnsureDefaultRolesAsync(context, cancellationToken);
    }

    private static async Task EnsureDefaultRolesAsync(AppDbContext context, CancellationToken cancellationToken)
    {
        var chatRooms = await context.ChatRooms
            .Include(cr => cr.Roles)
                .ThenInclude(r => r.RolePermissions)
            .ToListAsync(cancellationToken);

        if (chatRooms.Count == 0)
        {
            return;
        }

        var permissions = await context.ChatRoomPermissions
            .ToListAsync(cancellationToken);

        if (permissions.Count == 0)
        {
            return;
        }

        var hasChanges = false;

        foreach (var chatRoom in chatRooms)
        {
            foreach (var (roleName, defaults) in ChatRoomRoleDefaults.Defaults)
            {
                var role = chatRoom.Roles
                    .FirstOrDefault(r => string.Equals(r.Name, roleName, StringComparison.OrdinalIgnoreCase));

                if (role is null)
                {
                    role = new ChatRoomRole
                    {
                        ChatRoomId = chatRoom.Id,
                        Name = roleName,
                        Description = defaults.Description,
                        Color = defaults.Color,
                        IsDefault = true
                    };

                    context.ChatRoomRoles.Add(role);
                    chatRoom.Roles.Add(role);
                    hasChanges = true;
                }
                else if (!role.IsDefault)
                {
                    role.IsDefault = true;
                    hasChanges = true;
                }

                var existingPermissionIds = role.RolePermissions
                    .Select(rp => rp.PermissionId)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                foreach (var permission in permissions)
                {
                    if (existingPermissionIds.Contains(permission.Id))
                    {
                        continue;
                    }

                    var isAllowed = ChatRoomRoleDefaults.DefaultsPermissions.TryGetValue(
                        (roleName, permission.Name), out var allowed)
                        && allowed;

                    var rolePermission = new ChatRoomRolePermission
                    {
                        RoleId = role.Id,
                        PermissionId = permission.Id,
                        IsAllowed = isAllowed
                    };

                    context.ChatRoomRolePermissions.Add(rolePermission);
                    existingPermissionIds.Add(permission.Id);
                    hasChanges = true;
                }
            }
        }

        if (hasChanges)
        {
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
