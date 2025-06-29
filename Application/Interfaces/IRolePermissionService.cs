using Application.ChatRoomRoles.DTOs;

namespace Application.Interfaces;

public interface IRolePermissionService
{
    Task InitializePermissionsAsync();
    Task<List<ChatRoomRolePermissionDto>> CreatePermissionsAsync(string roleId);

    Task<List<ChatRoomRolePermissionDto>> GetPermissionsAsync(string roleId);
    Task<List<ChatRoomPermissionDto>> GetUserPermissionsAsync(string userId, string chatRoomId);
    Task<bool> CanSendMessagesAsync(string userId, string chatRoomId);
    Task<bool> CanCreateInviteLinkAsync(string userId, string chatRoomId);

    Task ChangePermissionsAsync(string roleId, List<ChangeRolePermissionDto> changeRolePermissionDtos);
}
