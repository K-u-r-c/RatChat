namespace Application.ChatRoomRoles.DTOs;

public class AssignChatRoomRoleDto
{
    public required string Id { get; set; }
    public required string UserId { get; set; }
    public required string ChatRoomId { get; set; }

    // Optional, can be null if not assigned by a user
    public string? AssignedById { get; set; }
}
