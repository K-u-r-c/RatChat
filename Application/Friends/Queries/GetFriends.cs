using Application.Core;
using Application.Friends.DTOs;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;
using Domain.Enums;

namespace Application.Friends.Queries;

public class GetFriends
{
    public class Query : IRequest<Result<List<FriendDto>>> { }

    public class Handler(AppDbContext context, IUserAccessor userAccessor, IUserStatusService userStatusService)
        : IRequestHandler<Query, Result<List<FriendDto>>>
    {
        public async Task<Result<List<FriendDto>>> Handle(Query request, CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();

            var friends = await context.UserFriends
                .Where(uf => uf.UserId == currentUser.Id)
                .Include(uf => uf.Friend)
                .Select(uf => new FriendDto
                {
                    Id = uf.Friend.Id,
                    DisplayName = uf.Friend.DisplayName ?? "",
                    Bio = uf.Friend.Bio,
                    ImageUrl = uf.Friend.ImageUrl,
                    BannerUrl = uf.Friend.BannerUrl,
                    FriendsSince = uf.FriendsSince,
                    Status = uf.Friend.Status.ToString(),
                    LastSeen = uf.Friend.LastSeen,
                    IsOnline = false // Updated below
                })
                .OrderBy(f => f.DisplayName)
                .ToListAsync(cancellationToken);

            foreach (var friend in friends)
            {
                var actualStatus = await userStatusService.GetActualUserStatusAsync(friend.Id);
                var isOnline = await userStatusService.IsUserOnlineAsync(friend.Id);

                friend.Status = actualStatus.ToString();
                friend.IsOnline = isOnline && (actualStatus == UserStatus.Online ||
                                              actualStatus == UserStatus.Away ||
                                              actualStatus == UserStatus.DoNotDisturb);
            }

            return Result<List<FriendDto>>.Success(friends);
        }
    }
}