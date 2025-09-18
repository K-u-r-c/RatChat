namespace Application.ChatRoomRoles.DTOs;

public class ChatRoomRoleDto
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string Color { get; set; } = "#99AAB5";
    public DateTime CreatedAt { get; set; }
    public required bool IsDefault { get; set; } = false;
    public required string ChatRoomId { get; set; }
    public List<ChatRoomRolePermissionDto> Permissions { get; set; } = [];
}