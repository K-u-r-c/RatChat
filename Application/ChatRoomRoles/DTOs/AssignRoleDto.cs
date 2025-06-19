namespace Application.ChatRoomRoles.DTOs;

public class AssignRoleDto
{
    public required string UserId { get; set; }
    public required string RoleId { get; set; }
    public required string ChatRoomId { get; set; }
}
