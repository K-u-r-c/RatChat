using Domain.Events;
using MediatR;

namespace Application.Friends.Events;

public class FriendshipCreatedNotification : INotification
{
    public FriendshipCreatedEvent Event { get; }

    public FriendshipCreatedNotification(FriendshipCreatedEvent domainEvent)
    {
        Event = domainEvent;
    }

    public string User1Id => Event.User1Id;
    public string User2Id => Event.User2Id;
    public DateTime CreatedAt => Event.OccurredAt;
}