using Application.Core;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Friends.Commands;

public class CancelFriendRequest
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string RequestId { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IUserAccessor userAccessor,
        IFriendsNotificationService notificationService)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();

            var friendRequest = await context.FriendRequests
                .FirstOrDefaultAsync(fr =>
                    fr.Id == request.RequestId &&
                    fr.SenderId == currentUser.Id &&
                    fr.Status == FriendRequestStatus.Pending, cancellationToken);

            if (friendRequest == null)
                return Result<Unit>.Failure("Friend request not found", 404);

            var receiverId = friendRequest.ReceiverId;

            friendRequest.Status = FriendRequestStatus.Cancelled;
            friendRequest.RespondedAt = DateTime.UtcNow;

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (result)
            {
                await notificationService.NotifyFriendRequestCancelled(receiverId, request.RequestId);

                return Result<Unit>.Success(Unit.Value);
            }

            return Result<Unit>.Failure("Failed to cancel friend request", 400);
        }
    }
}