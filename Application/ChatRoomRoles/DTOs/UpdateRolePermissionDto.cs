namespace Application.ChatRoomRoles.DTOs;

public class UpdateRolePermissionDto
{
    public required string Id { get; set; }
    public required bool IsAllowed { get; set; }
}
