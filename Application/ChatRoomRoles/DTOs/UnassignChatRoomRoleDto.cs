namespace Application.ChatRoomRoles.DTOs;

public class UnassignChatRoomRoleDto
{
    public required string Id { get; set; }
    public required string ChatRoomId { get; set; }
    public required string UserId { get; set; }
}
