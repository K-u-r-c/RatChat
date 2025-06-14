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

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
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
                    IsOnline = false, // TODO: Implement online status
                    LastSeen = null // TODO: Implement last seen
                })
                .OrderBy(f => f.DisplayName)
                .ToListAsync(cancellationToken);

            return Result<List<FriendDto>>.Success(friends);
        }
    }
}