using Application.Core;
using Application.Friends.DTOs;
using Application.Friends.Events;
using Application.Interfaces;
using Domain;
using Domain.Enums;
using Domain.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Friends.Commands;

public class RespondToFriendRequest
{
    public class Command : IRequest<Result<Unit>>
    {
        public required RespondToFriendRequestDto RespondToFriendRequestDto { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IUserAccessor userAccessor,
        IFriendsNotificationService notificationService,
        IPublisher publisher,
        IUserStatusService userStatusService
    ) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();

            var friendRequest = await context.FriendRequests
                .Include(fr => fr.Sender)
                .Include(fr => fr.Receiver)
                .FirstOrDefaultAsync(fr =>
                    fr.Id == request.RespondToFriendRequestDto.RequestId &&
                    fr.ReceiverId == currentUser.Id &&
                    fr.Status == FriendRequestStatus.Pending, cancellationToken);

            if (friendRequest == null)
                return Result<Unit>.Failure("Friend request not found", 404);

            FriendDto? newFriendForSender = null;
            FriendshipCreatedEvent? domainEvent = null;

            if (request.RespondToFriendRequestDto.Accept)
            {
                friendRequest.Status = FriendRequestStatus.Accepted;
                friendRequest.RespondedAt = DateTime.UtcNow;

                var friendship1 = new UserFriend
                {
                    UserId = currentUser.Id,
                    FriendId = friendRequest.SenderId
                };

                var friendship2 = new UserFriend
                {
                    UserId = friendRequest.SenderId,
                    FriendId = currentUser.Id
                };

                context.UserFriends.AddRange(friendship1, friendship2);

                var actualStatus = await userStatusService.GetActualUserStatusAsync(currentUser.Id);
                var isOnline = actualStatus is UserStatus.Online or UserStatus.Away or UserStatus.DoNotDisturb;

                newFriendForSender = new FriendDto
                {
                    Id = currentUser.Id,
                    DisplayName = currentUser.DisplayName ?? "",
                    Bio = currentUser.Bio,
                    ImageUrl = currentUser.ImageUrl,
                    BannerUrl = currentUser.BannerUrl,
                    FriendsSince = friendship2.FriendsSince,
                    IsOnline = isOnline,
                    Status = actualStatus.ToString(),
                    CustomStatusMessage = currentUser.CustomStatusMessage,
                    LastSeen = currentUser.LastSeen
                };

                domainEvent = new FriendshipCreatedEvent
                {
                    User1Id = currentUser.Id,
                    User2Id = friendRequest.SenderId
                };
            }
            else
            {
                friendRequest.Status = FriendRequestStatus.Declined;
                friendRequest.RespondedAt = DateTime.UtcNow;
            }

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (result)
            {
                if (request.RespondToFriendRequestDto.Accept && domainEvent != null)
                {
                    await publisher.Publish(new FriendshipCreatedNotification(domainEvent), cancellationToken);
                }

                if (request.RespondToFriendRequestDto.Accept && newFriendForSender != null)
                {
                    await notificationService.NotifyFriendRequestResponded(
                        friendRequest.SenderId,
                        currentUser.Id,
                        true,
                        newFriendForSender);
                }
                else
                {
                    await notificationService.NotifyFriendRequestResponded(
                        friendRequest.SenderId,
                        currentUser.Id,
                        false);
                }

                return Result<Unit>.Success(Unit.Value);
            }

            return Result<Unit>.Failure("Failed to respond to friend request", 400);
        }
    }
}