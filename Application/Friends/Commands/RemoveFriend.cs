using Application.Core;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Friends.Commands;

public class RemoveFriend
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string FriendId { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();

            var friendships = await context.UserFriends
                .Where(uf =>
                    (uf.UserId == currentUser.Id && uf.FriendId == request.FriendId) ||
                    (uf.UserId == request.FriendId && uf.FriendId == currentUser.Id))
                .ToListAsync(cancellationToken);

            if (friendships.Count == 0)
                return Result<Unit>.Failure("Friendship not found", 404);

            context.UserFriends.RemoveRange(friendships);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            return result
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Failed to remove friend", 400);
        }
    }
}