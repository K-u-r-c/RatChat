using Domain.Events;
using MediatR;

namespace Application.ChatRooms.Events;

public class ChatRoomProfileImageUpdatedNotification(ChatRoomProfileImageUpdatedEvent domainEvent) : INotification
{
    public DateTime UpdatedAt => domainEvent.OccurredAt;
}
