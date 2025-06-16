namespace Domain.Events;

public abstract class DomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public class FriendshipCreatedEvent : DomainEvent
{
    public required string User1Id { get; set; }
    public required string User2Id { get; set; }
}