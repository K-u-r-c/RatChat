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

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
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

            friendRequest.Status = FriendRequestStatus.Cancelled;

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            return result
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Failed to cancel friend request", 400);
        }
    }
}