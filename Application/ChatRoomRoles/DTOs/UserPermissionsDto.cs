namespace Application.ChatRoomRoles.DTOs;

public class UserPermissionsDto
{
    public required bool IsOwner { get; set; }
    public List<ChatRoomPermissionDto> Permissions { get; set; } = [];
}
