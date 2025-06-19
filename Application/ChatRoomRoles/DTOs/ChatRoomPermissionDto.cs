namespace Application.Roles.DTOs;

public class ChatRoomPermissionDto
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string DisplayName { get; set; }
    public string? Description { get; set; }
    public bool IsAllowed { get; set; }
}