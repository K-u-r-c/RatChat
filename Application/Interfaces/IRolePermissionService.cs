using Application.ChatRoomRoles.DTOs;

namespace Application.Interfaces;

public interface IRolePermissionService
{
    Task InitializePermissionsAsync();
    Task<List<ChatRoomRolePermissionDto>> CreatePermissionsAsync(string roleId);

    Task<List<ChatRoomRolePermissionDto>> GetPermissionsAsync(string roleId);
    Task<UserPermissionsDto> GetUserPermissionsAsync(string userId, string chatRoomId);
    Task<bool> HasPermissionAsync(string userId, string chatRoomId, string permissionName);

    Task UpdatePermissionsAsync(string roleId, List<UpdateRolePermissionDto> updateRolePermissionDtos);
}
