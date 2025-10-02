namespace Application.ChatRoomRoles.DTOs;

public class SetMemberDisplayRoleDto
{
    public required string ChatRoomId { get; set; }
    public required string UserId { get; set; }
    public string? RoleId { get; set; }
}
