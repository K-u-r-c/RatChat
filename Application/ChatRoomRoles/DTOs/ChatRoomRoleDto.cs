namespace Application.Roles.DTOs;

public class ChatRoomRoleDto
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string Color { get; set; } = "#99AAB5";
    public DateTime CreatedAt { get; set; }
    public int MemberCount { get; set; }
    public List<ChatRoomPermissionDto> Permissions { get; set; } = [];
}