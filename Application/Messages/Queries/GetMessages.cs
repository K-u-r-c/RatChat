using Application.Core;
using Application.Messages.DTOs;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Messages.Queries;

public class GetMessages
{
    public class Query : IRequest<Result<PagedList<MessageDto, DateTime?>>>
    {
        public required string ChatRoomId { get; set; }
        public DateTime? Cursor { get; set; }
        public int PageSize { get; set; } = 20;
    }

    public class Handler(AppDbContext context, IMapper mapper)
        : IRequestHandler<Query, Result<PagedList<MessageDto, DateTime?>>>
    {
        public async Task<Result<PagedList<MessageDto, DateTime?>>> Handle(
            Query request,
            CancellationToken cancellationToken)
        {
            if (!request.Cursor.HasValue)
            {
                var totalMessages = await context.Messages
                    .Where(x => x.ChatRoomId == request.ChatRoomId)
                    .CountAsync(cancellationToken);

                var query = context.Messages
                    .Where(x => x.ChatRoomId == request.ChatRoomId)
                    .OrderBy(x => x.CreatedAt);

                var messages = new List<MessageDto>();
                DateTime? nextCursor = null;

                if (totalMessages > request.PageSize)
                {
                    var skip = totalMessages - request.PageSize;
                    messages = await query
                        .Skip(skip)
                        .Take(request.PageSize)
                        .ProjectTo<MessageDto>(mapper.ConfigurationProvider)
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
                        .ProjectTo<MessageDto>(mapper.ConfigurationProvider)
                        .ToListAsync(cancellationToken);
                }

                return Result<PagedList<MessageDto, DateTime?>>.Success(
                    new PagedList<MessageDto, DateTime?>
                    {
                        Items = messages,
                        NextCursor = nextCursor
                    }
                );
            }
            else
            {
                var messages = await context.Messages
                    .Where(x => x.ChatRoomId == request.ChatRoomId && x.CreatedAt < request.Cursor.Value)
                    .OrderByDescending(x => x.CreatedAt)
                    .Take(request.PageSize + 1)
                    .ProjectTo<MessageDto>(mapper.ConfigurationProvider)
                    .ToListAsync(cancellationToken);

                messages.Reverse();

                DateTime? nextCursor = null;
                if (messages.Count > request.PageSize)
                {
                    nextCursor = messages[0].CreatedAt;
                    messages.RemoveAt(0);
                }

                return Result<PagedList<MessageDto, DateTime?>>.Success(
                    new PagedList<MessageDto, DateTime?>
                    {
                        Items = messages,
                        NextCursor = nextCursor
                    }
                );
            }
        }
    }
}