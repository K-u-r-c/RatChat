using Microsoft.EntityFrameworkCore;

namespace Domain;

public class ChatRoomMember
{
    public string? UserId { get; set; }
    public User User { get; set; } = null!;
    public string? ChatRoomId { get; set; }
    public ChatRoom ChatRoom { get; set; } = null!;
    public bool IsAdmin { get; set; }
    public DateTime DateJoined { get; set; } = DateTime.UtcNow;
}
