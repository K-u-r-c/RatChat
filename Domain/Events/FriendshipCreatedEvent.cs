namespace Domain.Events;

public class FriendshipCreatedEvent : DomainEvent
{
    public required string User1Id { get; set; }
    public required string User2Id { get; set; }
}