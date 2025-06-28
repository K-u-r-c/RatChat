namespace Application.ChatRoomRoles.DTOs;

public class CreateChatRoomRoleDto : BaseChatRoomRoleDto
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string Color { get; set; } = "#99AAB5";
    public List<RolePermissionDto> Permissions { get; set; } = [];
}
