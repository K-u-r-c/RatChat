namespace Domain;

public class ChatRoom
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Title { get; set; }
    public string Slug { get; set; } = string.Empty;
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public required string OwnerId { get; set; }
    public User Owner { get; set; } = null!;
    public string? ImageUrl { get; set; }

    // Navigation properties
    public ICollection<ChatRoomMember> Members { get; set; } = [];
    public ICollection<Message> Messages { get; set; } = [];
    public ICollection<ChatRoomRole> Roles { get; set; } = [];
    public ICollection<ChatRoomInvite> Invites { get; set; } = [];
    public ICollection<ChatRoomBan> Bans { get; set; } = [];
    public ICollection<ChatChannel> Channels { get; set; } = [];
}
