namespace Application.ChatRoomRoles.DTOs;

public class CreateRoleDto
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string Color { get; set; } = "#99AAB5";
    public List<RolePermissionDto> Permissions { get; set; } = [];
}
