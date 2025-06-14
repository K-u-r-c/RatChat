using Application.Core;
using Application.Friends.DTOs;
using Application.Interfaces;
using Domain;
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

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();

            var friendRequest = await context.FriendRequests
                .Include(fr => fr.Sender)
                .FirstOrDefaultAsync(fr =>
                    fr.Id == request.RespondToFriendRequestDto.RequestId &&
                    fr.ReceiverId == currentUser.Id &&
                    fr.Status == FriendRequestStatus.Pending, cancellationToken);

            if (friendRequest == null)
                return Result<Unit>.Failure("Friend request not found", 404);

            if (request.RespondToFriendRequestDto.Accept)
            {
                // Accept the request
                friendRequest.Status = FriendRequestStatus.Accepted;
                friendRequest.RespondedAt = DateTime.UtcNow;

                // Create friendship both ways
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
            }
            else
            {
                // Decline the request
                friendRequest.Status = FriendRequestStatus.Declined;
                friendRequest.RespondedAt = DateTime.UtcNow;
            }

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            return result
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Failed to respond to friend request", 400);
        }
    }
}