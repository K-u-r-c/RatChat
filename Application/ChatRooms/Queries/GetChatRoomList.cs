using Application.ChatRooms.DTOs;
using Application.Core;
using Application.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.ChatRooms.Queries;

public class GetChatRoomList
{
    public class Query : IRequest<Result<PagedList<ChatRoomDto, DateTime?>>>
    {
        public required ChatRoomParams Params { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor)
        : IRequestHandler<Query, Result<PagedList<ChatRoomDto, DateTime?>>>
    {
        public async Task<Result<PagedList<ChatRoomDto, DateTime?>>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var userId = userAccessor.GetUserId();

            var baseQuery = context.ChatRooms
                .Where(x => x.Members.Any(m => m.UserId == userId))
                .Select(x => new
                {
                    ChatRoom = x,
                    x.Members.FirstOrDefault(m => m.UserId == userId)!.DateJoined
                });

            if (request.Params.Cursor.HasValue)
            {
                baseQuery = baseQuery.Where(x => x.DateJoined >= request.Params.Cursor.Value);
            }

            var orderedQuery = baseQuery
                .OrderBy(x => x.DateJoined)
                .Select(x => x.ChatRoom)
                .AsQueryable();

            var projectedChatRooms = orderedQuery.ProjectTo<ChatRoomDto>(
                mapper.ConfigurationProvider,
                new { currentUserId = userId }
            );

            var chatRooms = await projectedChatRooms
                .Take(request.Params.PageSize + 1)
                .ToListAsync(cancellationToken);

            DateTime? nextCursor = null;
            if (chatRooms.Count > request.Params.PageSize)
            {
                var lastChatRoomId = chatRooms.Last().Id;
                var lastDateJoined = await context.ChatRooms
                    .Where(x => x.Id == lastChatRoomId)
                    .SelectMany(x => x.Members)
                    .Where(m => m.UserId == userId)
                    .Select(m => m.DateJoined)
                    .FirstOrDefaultAsync(cancellationToken);

                nextCursor = lastDateJoined;
                chatRooms.RemoveAt(chatRooms.Count - 1);
            }

            return Result<PagedList<ChatRoomDto, DateTime?>>.Success(
                new PagedList<ChatRoomDto, DateTime?>
                {
                    Items = chatRooms,
                    NextCursor = nextCursor
                }
            );
        }
    }
}
