using Application.Core;
using Application.Friends.DTOs;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

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
                    Slug = uf.Friend.Slug,
                    Bio = uf.Friend.Bio,
                    ImageUrl = uf.Friend.ImageUrl,
                    BannerUrl = uf.Friend.BannerUrl,
                    FriendsSince = uf.FriendsSince,
                    Status = uf.Friend.Status.ToString(),
                    LastSeen = uf.Friend.LastSeen,
                    IsOnline = false
                })
                .OrderBy(f => f.DisplayName)
                .ToListAsync(cancellationToken);

            if (friends.Count == 0)
                return Result<List<FriendDto>>.Success(friends);

            var statusMap = await userStatusService.GetActualStatusesAsync(friends.Select(f => f.Id));

            foreach (var friend in friends)
            {
                if (statusMap.TryGetValue(friend.Id, out var tuple))
                {
                    friend.Status = tuple.Status.ToString();
                    friend.IsOnline = tuple.IsOnline;
                    friend.LastSeen = tuple.LastSeen;
                }
            }

            return Result<List<FriendDto>>.Success(friends);
        }
    }
}