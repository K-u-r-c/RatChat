namespace Domain;

public class ChatRoomRole
{
    public required string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string Color { get; set; } = "#ffffff"; // Default color white
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDefault { get; set; } = false;

    // Navigation properties
    public required string ChatRoomId { get; set; }
    public ChatRoom ChatRoom { get; set; } = null!;
    public ICollection<ChatRoomMemberRole> MemberRoles { get; set; } = [];
    public ICollection<ChatRoomRolePermission> RolePermissions { get; set; } = [];
}
