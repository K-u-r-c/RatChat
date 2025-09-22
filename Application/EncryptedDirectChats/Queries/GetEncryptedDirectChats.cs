using Application.Core;
using Application.EncryptedDirectChats.DTOs;
using Application.Interfaces;
using Domain.Extensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.EncryptedDirectChats.Queries;

public class GetEncryptedDirectChats
{
    public class Query : IRequest<Result<List<EncryptedDirectChatDto>>> { }

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Query, Result<List<EncryptedDirectChatDto>>>
    {
        public async Task<Result<List<EncryptedDirectChatDto>>> Handle(Query request, CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();

            var chats = await context.EncryptedDirectChats
                .Where(dc => dc.User1Id == currentUser.Id || dc.User2Id == currentUser.Id)
                .Include(dc => dc.User1)
                .Include(dc => dc.User2)
                .OrderByDescending(dc => dc.LastActivityAt)
                .Select(dc => new EncryptedDirectChatDto
                {
                    Id = dc.Id,
                    OtherUserId = dc.User1Id == currentUser.Id ? dc.User2Id : dc.User1Id,
                    OtherUserDisplayName = dc.User1Id == currentUser.Id
                        ? dc.User2.DisplayName ?? string.Empty
                        : dc.User1.DisplayName ?? string.Empty,
                    OtherUserSlug = dc.User1Id == currentUser.Id
                        ? dc.User2.Slug
                        : dc.User1.Slug,
                    OtherUserImageUrl = dc.User1Id == currentUser.Id
                        ? dc.User2.ImageUrl
                        : dc.User1.ImageUrl,
                    LastActivityAt = dc.LastActivityAt,
                    LastMessageSenderId = dc.LastMessageSenderId,
                    IsOnline = dc.User1Id == currentUser.Id
                        ? dc.User2.Status.IsConsideredOnline()
                        : dc.User1.Status.IsConsideredOnline(),
                    LastSeen = dc.User1Id == currentUser.Id ? dc.User2.LastSeen : dc.User1.LastSeen,
                    Status = dc.User1Id == currentUser.Id
                        ? dc.User2.Status.ToString()
                        : dc.User1.Status.ToString()
                })
                .ToListAsync(cancellationToken);

            return Result<List<EncryptedDirectChatDto>>.Success(chats);
        }
    }
}
