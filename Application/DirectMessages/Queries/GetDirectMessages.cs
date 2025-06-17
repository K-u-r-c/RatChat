using Application.Core;
using Application.DirectMessages.DTOs;
using Application.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.DirectMessages.Queries;

public class GetDirectMessages
{
    public class Query : IRequest<Result<PagedList<DirectMessageDto, DateTime?>>>
    {
        public required string DirectChatId { get; set; }
        public DateTime? Cursor { get; set; }
        public int PageSize { get; set; } = 20;
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor)
        : IRequestHandler<Query, Result<PagedList<DirectMessageDto, DateTime?>>>
    {
        public async Task<Result<PagedList<DirectMessageDto, DateTime?>>> Handle(
            Query request,
            CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();

            var hasAccess = await context.DirectChats
                .AnyAsync(dc => dc.Id == request.DirectChatId &&
                               (dc.User1Id == currentUser.Id || dc.User2Id == currentUser.Id),
                         cancellationToken);

            if (!hasAccess)
                return Result<PagedList<DirectMessageDto, DateTime?>>.Failure("Access denied", 403);

            if (!request.Cursor.HasValue)
            {
                var totalMessages = await context.DirectMessages
                    .Where(x => x.DirectChatId == request.DirectChatId)
                    .CountAsync(cancellationToken);

                var query = context.DirectMessages
                    .Where(x => x.DirectChatId == request.DirectChatId)
                    .OrderBy(x => x.CreatedAt);

                var messages = new List<DirectMessageDto>();
                DateTime? nextCursor = null;

                if (totalMessages > request.PageSize)
                {
                    var skip = totalMessages - request.PageSize;
                    messages = await query
                        .Skip(skip)
                        .Take(request.PageSize)
                        .ProjectTo<DirectMessageDto>(
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
                        .ProjectTo<DirectMessageDto>(
                            mapper.ConfigurationProvider,
                            new { currentUserId = currentUser.Id }
                        )
                        .ToListAsync(cancellationToken);
                }

                return Result<PagedList<DirectMessageDto, DateTime?>>.Success(
                    new PagedList<DirectMessageDto, DateTime?>
                    {
                        Items = messages,
                        NextCursor = nextCursor
                    }
                );
            }
            else
            {
                var messages = await context.DirectMessages
                    .Where(x => x.DirectChatId == request.DirectChatId && x.CreatedAt < request.Cursor.Value)
                    .OrderByDescending(x => x.CreatedAt)
                    .Take(request.PageSize + 1)
                    .ProjectTo<DirectMessageDto>(
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

                return Result<PagedList<DirectMessageDto, DateTime?>>.Success(
                    new PagedList<DirectMessageDto, DateTime?>
                    {
                        Items = messages,
                        NextCursor = nextCursor
                    }
                );
            }
        }
    }
}