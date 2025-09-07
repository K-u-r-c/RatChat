using Application.Core;
using Application.Friends.DTOs;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Friends.Queries;

public class SearchUsers
{
    public class Query : IRequest<Result<List<FriendSearchDto>>>
    {
        public required string Text { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Query, Result<List<FriendSearchDto>>>
    {
        public async Task<Result<List<FriendSearchDto>>> Handle(Query request, CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();
            var raw = (request.Text ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(raw))
                return Result<List<FriendSearchDto>>.Success(new List<FriendSearchDto>());

            // Parse potential pattern: name/email + optional #tag, or only tag
            string? nameOrEmail = raw;
            int? tagFilter = null;

            var hashIndex = raw.IndexOf('#');
            if (hashIndex >= 0)
            {
                var left = raw.Substring(0, hashIndex).Trim();
                var right = raw.Substring(hashIndex + 1).Trim();

                if (int.TryParse(new string(right.TakeWhile(char.IsDigit).ToArray()), out var tag))
                {
                    tagFilter = tag;
                    nameOrEmail = left;
                }
            }
            else if (int.TryParse(raw, out var onlyTag))
            {
                tagFilter = onlyTag;
                nameOrEmail = null;
            }

            var users = context.Users.AsQueryable();

            users = users.Where(u => u.Id != currentUser.Id);

            if (tagFilter.HasValue)
            {
                users = users.Where(u => u.Tag == tagFilter.Value);
            }

            if (!string.IsNullOrWhiteSpace(nameOrEmail))
            {
                var q = nameOrEmail.Trim();
                if (q.Contains('@'))
                {
                    // email search: allow partial contains
                    users = users.Where(u => u.Email != null && EF.Functions.Like(u.Email!, $"%{q}%"));
                }
                else
                {
                    // display name search: case-insensitive contains
                    users = users.Where(u => u.DisplayName != null && EF.Functions.Like(u.DisplayName!, $"%{q}%"));
                }
            }

            var results = await users
                .OrderBy(u => u.DisplayName)
                .ThenBy(u => u.Tag)
                .Take(25)
                .Select(u => new { u.Id, u.DisplayName, u.ImageUrl, u.Tag })
                .ToListAsync(cancellationToken);

            var userIds = results.Select(r => r.Id).ToList();

            var friendPairs = await context.UserFriends
                .Where(uf => (uf.UserId == currentUser.Id && userIds.Contains(uf.FriendId))
                             || (userIds.Contains(uf.UserId) && uf.FriendId == currentUser.Id))
                .Select(uf => new { uf.UserId, uf.FriendId })
                .ToListAsync(cancellationToken);

            var pendingRequests = await context.FriendRequests
                .Where(fr => (fr.SenderId == currentUser.Id && userIds.Contains(fr.ReceiverId))
                             || (userIds.Contains(fr.SenderId) && fr.ReceiverId == currentUser.Id))
                .Where(fr => fr.Status == FriendRequestStatus.Pending)
                .Select(fr => new { fr.SenderId, fr.ReceiverId })
                .ToListAsync(cancellationToken);

            var resultDtos = results.Select(r => new FriendSearchDto
            {
                Id = r.Id,
                DisplayName = r.DisplayName ?? string.Empty,
                Tag = r.Tag,
                ImageUrl = r.ImageUrl,
                IsAlreadyFriend = friendPairs.Any(fp => (fp.UserId == currentUser.Id && fp.FriendId == r.Id) || (fp.UserId == r.Id && fp.FriendId == currentUser.Id)),
                HasPendingRequest = pendingRequests.Any(pr => (pr.SenderId == currentUser.Id && pr.ReceiverId == r.Id) || (pr.SenderId == r.Id && pr.ReceiverId == currentUser.Id)),
            }).ToList();

            return Result<List<FriendSearchDto>>.Success(resultDtos);
        }
    }
}
