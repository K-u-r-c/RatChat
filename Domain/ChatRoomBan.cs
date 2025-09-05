namespace Domain;

public class ChatRoomBan
{
    public string? UserId { get; set; }
    public User User { get; set; } = null!;

    public string? ChatRoomId { get; set; }
    public ChatRoom ChatRoom { get; set; } = null!;

    public DateTime DateBanned { get; set; } = DateTime.UtcNow;
}
