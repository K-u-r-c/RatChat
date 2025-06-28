namespace Application.ChatRoomRoles.DTOs;

public class AssignChatRoomRoleDto : BaseChatRoomRoleDto
{
    public required string UserId { get; set; }
    
    // Optional, can be null if not assigned by a user
    public string? AssignedById { get; set; }
}
