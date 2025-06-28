namespace Application.ChatRoomRoles.DTOs;

public class MemberRoleDto
{
    public required string UserId { get; set; }
    public required string ChatRoomId { get; set; }
    public required string RoleId { get; set; }
    public required string RoleName { get; set; }
    public required DateTime AssignedAt { get; set; }
    public string? AssignedBy { get; set; }
}
