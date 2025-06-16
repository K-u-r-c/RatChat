using Application.Core;
using Application.DirectChats.DTOs;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.DirectChats.Queries;

public class GetDirectChats
{
    public class Query : IRequest<Result<List<DirectChatDto>>> { }

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Query, Result<List<DirectChatDto>>>
    {
        public async Task<Result<List<DirectChatDto>>> Handle(Query request, CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();

            var directChats = await context.DirectChats
                .Where(dc => dc.User1Id == currentUser.Id || dc.User2Id == currentUser.Id)
                .Include(dc => dc.User1)
                .Include(dc => dc.User2)
                .OrderByDescending(dc => dc.LastMessageAt)
                .Select(dc => new DirectChatDto
                {
                    Id = dc.Id,
                    OtherUserId = dc.User1Id == currentUser.Id ? dc.User2Id : dc.User1Id,
                    OtherUserDisplayName = dc.User1Id == currentUser.Id
                        ? dc.User2.DisplayName ?? ""
                        : dc.User1.DisplayName ?? "",
                    OtherUserImageUrl = dc.User1Id == currentUser.Id
                        ? dc.User2.ImageUrl
                        : dc.User1.ImageUrl,
                    LastMessageAt = dc.LastMessageAt,
                    LastMessageBody = dc.LastMessageBody,
                    LastMessageSenderId = dc.LastMessageSenderId,
                    UnreadCount = dc.Messages.Count(m =>
                        m.SenderId != currentUser.Id && !m.IsRead),
                    IsOnline = false, // TODO: Implement online status
                    CanSendMessages = context.UserFriends.Any(uf =>
                        (uf.UserId == currentUser.Id && uf.FriendId == (dc.User1Id == currentUser.Id ? dc.User2Id : dc.User1Id)) ||
                        (uf.UserId == (dc.User1Id == currentUser.Id ? dc.User2Id : dc.User1Id) && uf.FriendId == currentUser.Id))
                })
                .ToListAsync(cancellationToken);

            return Result<List<DirectChatDto>>.Success(directChats);
        }
    }
}