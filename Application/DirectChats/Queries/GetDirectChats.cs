using Application.Core;
using Application.DirectChats.DTOs;
using Application.Interfaces;
using Domain.Enums;
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
                    CanSendMessages = context.UserFriends.Any(uf =>
                        (
                            uf.UserId == currentUser.Id &&
                            uf.FriendId == (dc.User1Id == currentUser.Id ? dc.User2Id : dc.User1Id)
                        ) ||
                        (
                            uf.UserId == (dc.User1Id == currentUser.Id ? dc.User2Id : dc.User1Id) &&
                            uf.FriendId == currentUser.Id
                        )),
                    IsOnline = dc.User1Id == currentUser.Id
                        ? (
                            dc.User2.Status == UserStatus.Online ||
                            dc.User2.Status == UserStatus.Away ||
                            dc.User2.Status == UserStatus.DoNotDisturb
                        )
                        : (
                            dc.User1.Status == UserStatus.Online ||
                            dc.User1.Status == UserStatus.Away ||
                            dc.User1.Status == UserStatus.DoNotDisturb
                        ),
                    LastSeen = dc.User1Id == currentUser.Id ? dc.User2.LastSeen : dc.User1.LastSeen,
                    Status = dc.User1Id == currentUser.Id
                        ? dc.User2.Status.ToString()
                        : dc.User1.Status.ToString(),
                    CustomStatusMessage = dc.User1Id == currentUser.Id
                        ? dc.User2.CustomStatusMessage
                        : dc.User1.CustomStatusMessage
                })
                .ToListAsync(cancellationToken);

            return Result<List<DirectChatDto>>.Success(directChats);
        }
    }
}