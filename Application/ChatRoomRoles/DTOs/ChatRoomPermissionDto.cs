namespace Application.ChatRoomRoles.DTOs;

public class ChatRoomRolePermissionDto
{
    public required string RoleId { get; set; }
    public required string PermissionId { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required bool IsAllowed { get; set; }
}