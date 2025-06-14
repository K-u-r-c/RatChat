using Application.Core;
using Application.Friends.DTOs;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Friends.Queries;

public class SearchUserByFriendCode
{
    public class Query : IRequest<Result<FriendSearchDto>>
    {
        public required string FriendCode { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Query, Result<FriendSearchDto>>
    {
        public async Task<Result<FriendSearchDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();
            var friendCode = request.FriendCode.ToUpper();

            var targetUser = await context.Users
                .FirstOrDefaultAsync(u => u.FriendCode == friendCode, cancellationToken);

            if (targetUser == null)
                return Result<FriendSearchDto>.Failure("User with this friend code not found", 404);

            if (targetUser.Id == currentUser.Id)
                return Result<FriendSearchDto>.Failure("You cannot add yourself as a friend", 400);

            // Check if already friends
            var isAlreadyFriend = await context.UserFriends
                .AnyAsync(uf =>
                    (uf.UserId == currentUser.Id && uf.FriendId == targetUser.Id) ||
                    (uf.UserId == targetUser.Id && uf.FriendId == currentUser.Id), cancellationToken);

            // Check if there's a pending request
            var hasPendingRequest = await context.FriendRequests
                .AnyAsync(fr =>
                    ((fr.SenderId == currentUser.Id && fr.ReceiverId == targetUser.Id) ||
                     (fr.SenderId == targetUser.Id && fr.ReceiverId == currentUser.Id)) &&
                    fr.Status == FriendRequestStatus.Pending, cancellationToken);

            var result = new FriendSearchDto
            {
                Id = targetUser.Id,
                DisplayName = targetUser.DisplayName ?? "",
                FriendCode = targetUser.FriendCode,
                ImageUrl = targetUser.ImageUrl,
                IsAlreadyFriend = isAlreadyFriend,
                HasPendingRequest = hasPendingRequest
            };

            return Result<FriendSearchDto>.Success(result);
        }
    }
}