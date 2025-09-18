namespace Domain;

public enum FriendRequestStatus
{
    Pending,
    Accepted,
    Declined,
    Cancelled
}

public class FriendRequest
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string SenderId { get; set; }
    public User Sender { get; set; } = null!;
    public required string ReceiverId { get; set; }
    public User Receiver { get; set; } = null!;
    public FriendRequestStatus Status { get; set; } = FriendRequestStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
    public string? Message { get; set; }
}
