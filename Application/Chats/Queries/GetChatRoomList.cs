using Application.Chats.DTOs;
using Application.Core;
using Application.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Chats.Queries;

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
            var query = context.ChatRooms
                .OrderBy(x => x.Id)
                .Where(x => x.Date >= (request.Params.Cursor ?? request.Params.StartDate))
                .AsQueryable();

            if (!string.IsNullOrEmpty(request.Params.Filter))
            {
                query = request.Params.Filter switch
                {
                    "isMember" => query.Where(
                        x => x.Members.Any(
                            a => a.UserId == userAccessor.GetUserId()
                        )
                    ),
                    "isAdmin" => query.Where(
                        x => x.Members.Any(
                            a => a.IsAdmin && a.UserId == userAccessor.GetUserId()
                        )
                    ),
                    _ => query
                };
            }

            var projectedChatRooms = query.ProjectTo<ChatRoomDto>(
                mapper.ConfigurationProvider,
                new { currentUserId = userAccessor.GetUserId() }
            );

            var chatRooms = await projectedChatRooms
                .Take(request.Params.PageSize + 1)
                .ToListAsync(cancellationToken);

            DateTime? nextCursor = null;
            if (chatRooms.Count > request.Params.PageSize)
            {
                nextCursor = chatRooms.Last().Date;
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
