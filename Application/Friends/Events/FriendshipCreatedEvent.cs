using Domain.Events;
using MediatR;

namespace Application.Friends.Events;

public class FriendshipCreatedNotification(FriendshipCreatedEvent domainEvent) : INotification
{
    public string User1Id => domainEvent.User1Id;
    public string User2Id => domainEvent.User2Id;
    public DateTime CreatedAt => domainEvent.OccurredAt;
}