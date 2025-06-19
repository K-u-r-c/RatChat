namespace Application.ChatRoomRoles.DTOs;

public class RolePermissionDto
{
    public required string PermissionId { get; set; }
    public bool IsAllowed { get; set; }
}
