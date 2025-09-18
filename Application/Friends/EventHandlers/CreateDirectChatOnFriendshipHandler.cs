using Application.DirectChats.Commands;
using Application.Friends.Events;
using Application.Interfaces;
using MediatR;

namespace Application.Friends.EventHandlers;

public class CreateDirectChatOnFriendshipHandler(IMediator mediator, IUserAccessor userAccessor) : INotificationHandler<FriendshipCreatedNotification>
{
    public async Task Handle(FriendshipCreatedNotification notification, CancellationToken cancellationToken)
    {
        var currentUser = await userAccessor.GetUserAsync();
        var otherUserId = currentUser.Id == notification.User1Id ? notification.User2Id : notification.User1Id;

        await mediator.Send(new CreateDirectChat.Command { OtherUserId = otherUserId }, cancellationToken);
    }
}