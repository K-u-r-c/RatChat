namespace Application.ChatRoomRoles.DTOs;

public class UpdateRoleDto
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? Color { get; set; }
    public List<RolePermissionDto> Permissions { get; set; } = [];
}