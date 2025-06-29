namespace Application.ChatRoomRoles.DTOs;

public class UpdateChatRoomRoleDto
{
    public required string Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Color { get; set; }
    public List<ChangeRolePermissionDto> Permissions { get; set; } = [];
}