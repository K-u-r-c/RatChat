namespace Domain.Events;

public class ChatRoomProfileImageUpdatedEvent : DomainEvent
{
    public required string ChatRoomId { get; set; }
    public string? ImageUrl { get; set; }
}
