namespace Application.ChatRoomRoles.DTOs;

public class AssignedChatRoomRoleDto
{
    public required string UserId { get; set; }
    public required ChatRoomRoleDto Role { get; set; }
}
