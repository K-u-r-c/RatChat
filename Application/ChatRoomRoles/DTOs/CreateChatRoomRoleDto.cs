namespace Application.ChatRoomRoles.DTOs;

public class CreateChatRoomRoleDto
{
    public required string ChatRoomId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string Color { get; set; } = "#99AAB5";
}
