using Application.Core;
using Application.EncryptedDirectMessages.DTOs;
using Application.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.EncryptedDirectMessages.Queries;

public class GetEncryptedDirectMessages
{
    public class Query : IRequest<Result<PagedList<EncryptedDirectMessageDto, DateTime?>>>
    {
        public required string EncryptedDirectChatId { get; set; }
        public DateTime? Cursor { get; set; }
        public int PageSize { get; set; } = 20;
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor)
        : IRequestHandler<Query, Result<PagedList<EncryptedDirectMessageDto, DateTime?>>>
    {
        public async Task<Result<PagedList<EncryptedDirectMessageDto, DateTime?>>> Handle(
            Query request,
            CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();

            var hasAccess = await context.EncryptedDirectChats
                .AnyAsync(dc => dc.Id == request.EncryptedDirectChatId &&
                                (dc.User1Id == currentUser.Id || dc.User2Id == currentUser.Id),
                         cancellationToken);

            if (!hasAccess)
            {
                return Result<PagedList<EncryptedDirectMessageDto, DateTime?>>.Failure("Access denied", 403);
            }

            if (!request.Cursor.HasValue)
            {
                var totalMessages = await context.EncryptedDirectMessages
                    .Where(x => x.EncryptedDirectChatId == request.EncryptedDirectChatId)
                    .CountAsync(cancellationToken);

                var query = context.EncryptedDirectMessages
                    .Where(x => x.EncryptedDirectChatId == request.EncryptedDirectChatId)
                    .Include(x => x.Reactions).ThenInclude(r => r.User)
                    .Include(x => x.ReplyToEncryptedDirectMessage).ThenInclude(m => m!.Sender)
                    .OrderBy(x => x.CreatedAt);

                var messages = new List<EncryptedDirectMessageDto>();
                DateTime? nextCursor = null;

                if (totalMessages > request.PageSize)
                {
                    var skip = totalMessages - request.PageSize;
                    messages = await query
                        .Skip(skip)
                        .Take(request.PageSize)
                        .ProjectTo<EncryptedDirectMessageDto>(
                            mapper.ConfigurationProvider,
                            new { currentUserId = currentUser.Id }
                        )
                        .ToListAsync(cancellationToken);

                    if (messages.Count != 0)
                    {
                        nextCursor = messages[0].CreatedAt;
                    }
                }
                else
                {
                    messages = await query
                        .Take(request.PageSize)
                        .ProjectTo<EncryptedDirectMessageDto>(
                            mapper.ConfigurationProvider,
                            new { currentUserId = currentUser.Id }
                        )
                        .ToListAsync(cancellationToken);
                }

                return Result<PagedList<EncryptedDirectMessageDto, DateTime?>>.Success(
                    new PagedList<EncryptedDirectMessageDto, DateTime?>
                    {
                        Items = messages,
                        NextCursor = nextCursor
                    }
                );
            }
            else
            {
                var messages = await context.EncryptedDirectMessages
                    .Where(x => x.EncryptedDirectChatId == request.EncryptedDirectChatId && x.CreatedAt < request.Cursor.Value)
                    .Include(x => x.Reactions).ThenInclude(r => r.User)
                    .Include(x => x.ReplyToEncryptedDirectMessage).ThenInclude(m => m!.Sender)
                    .OrderByDescending(x => x.CreatedAt)
                    .Take(request.PageSize + 1)
                    .ProjectTo<EncryptedDirectMessageDto>(
                        mapper.ConfigurationProvider,
                        new { currentUserId = currentUser.Id }
                    )
                    .ToListAsync(cancellationToken);

                messages.Reverse();

                DateTime? nextCursor = null;
                if (messages.Count > request.PageSize)
                {
                    nextCursor = messages[0].CreatedAt;
                    messages.RemoveAt(0);
                }

                return Result<PagedList<EncryptedDirectMessageDto, DateTime?>>.Success(
                    new PagedList<EncryptedDirectMessageDto, DateTime?>
                    {
                        Items = messages,
                        NextCursor = nextCursor
                    }
                );
            }
        }
    }
}
