
namespace Domain;

public class ChatRoomMemberRole
{
    public required string UserId { get; set; }
    public User User { get; set; } = null!;
    
    public required string ChatRoomId { get; set; }
    public ChatRoom ChatRoom { get; set; } = null!;

    public required string RoleId { get; set; }
    public ChatRoomRole Role { get; set; } = null!;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public string? AssignedById { get; set; }
    public User? AssignedBy { get; set; } = null!;
}
