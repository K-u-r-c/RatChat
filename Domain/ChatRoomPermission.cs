namespace Domain;

public class ChatRoomPermission
{
    public required string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Name { get; set; }
    public required string Description { get; set; }

    // Navigation properties
    public ICollection<ChatRoomRolePermission> RolePermissions { get; set; } = [];
}
