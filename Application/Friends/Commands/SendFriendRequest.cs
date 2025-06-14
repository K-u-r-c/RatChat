using Application.Core;
using Application.Friends.DTOs;
using Application.Interfaces;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Friends.Commands;

public class SendFriendRequest
{
    public class Command : IRequest<Result<Unit>>
    {
        public required SendFriendRequestDto SendFriendRequestDto { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IUserAccessor userAccessor,
        IFriendsNotificationService notificationService,
        IMapper mapper)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();
            var friendCode = request.SendFriendRequestDto.FriendCode.ToUpper();

            var targetUser = await context.Users
                .FirstOrDefaultAsync(u => u.FriendCode == friendCode, cancellationToken);

            if (targetUser == null)
                return Result<Unit>.Failure("User with this friend code not found", 404);

            if (targetUser.Id == currentUser.Id)
                return Result<Unit>.Failure("You cannot send a friend request to yourself", 400);

            var existingFriendship = await context.UserFriends
                .AnyAsync(uf =>
                    (uf.UserId == currentUser.Id && uf.FriendId == targetUser.Id) ||
                    (uf.UserId == targetUser.Id && uf.FriendId == currentUser.Id), cancellationToken);

            if (existingFriendship)
                return Result<Unit>.Failure("You are already friends with this user", 400);

            var existingRequest = await context.FriendRequests
                .FirstOrDefaultAsync(fr =>
                    ((fr.SenderId == currentUser.Id && fr.ReceiverId == targetUser.Id) ||
                     (fr.SenderId == targetUser.Id && fr.ReceiverId == currentUser.Id)) &&
                    fr.Status == FriendRequestStatus.Pending, cancellationToken);

            if (existingRequest != null)
            {
                if (existingRequest.SenderId == currentUser.Id)
                    return Result<Unit>.Failure("You already have a pending friend request to this user", 400);
                else
                    return Result<Unit>.Failure("This user has already sent you a friend request", 400);
            }

            var friendRequest = new FriendRequest
            {
                SenderId = currentUser.Id,
                ReceiverId = targetUser.Id,
                Message = request.SendFriendRequestDto.Message
            };

            context.FriendRequests.Add(friendRequest);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (result)
            {
                var friendRequestWithDetails = await context.FriendRequests
                    .Include(fr => fr.Sender)
                    .Include(fr => fr.Receiver)
                    .FirstOrDefaultAsync(fr => fr.Id == friendRequest.Id, cancellationToken);

                if (friendRequestWithDetails != null)
                {
                    var friendRequestDto = mapper.Map<FriendRequestDto>(friendRequestWithDetails);
                    await notificationService.NotifyFriendRequestSent(targetUser.Id, friendRequestDto);
                }

                return Result<Unit>.Success(Unit.Value);
            }

            return Result<Unit>.Failure("Failed to send friend request", 400);
        }
    }
}