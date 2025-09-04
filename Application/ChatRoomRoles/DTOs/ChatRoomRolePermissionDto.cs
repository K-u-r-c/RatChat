namespace Application.ChatRoomRoles.DTOs;

public class ChatRoomRolePermissionDto
{
    public required string RoleId { get; set; }
    public required ChatRoomPermissionDto Permission { get; set; }
    public required bool IsAllowed { get; set; }
}