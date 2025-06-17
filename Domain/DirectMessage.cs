namespace Domain;

public class DirectMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Body { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;

    public required string SenderId { get; set; }
    public User Sender { get; set; } = null!;
    public required string DirectChatId { get; set; }
    public DirectChat DirectChat { get; set; } = null!;
}