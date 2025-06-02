namespace Domain;

public class ChatRoom
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Title { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<ChatRoomMember> Members { get; set; } = [];
    public ICollection<Message> Messages { get; set; } = [];
}
