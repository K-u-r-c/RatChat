namespace Application.Interfaces;

public interface IRolePermissionService
{
    Task InitializePermissionsAsync();
    Task<bool> HasPermissionAsync(string userId, string chatRoomId, string permission);
    Task<List<string>> GetUserPermissionsAsync(string userId, string chatRoomId);

    Task<bool> CanSendMessagesAsync(string userId, string chatRoomId);
    Task<bool> CanCreateInvitationsAsync(string userId, string chatRoomId);
}
