namespace Application.ChatRoomRoles.DTOs;

public class ChangeRolePermissionDto
{
    public required string Id { get; set; }
    public required bool IsAllowed { get; set; }
}
