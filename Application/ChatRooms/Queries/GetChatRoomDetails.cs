using Application.ChatRooms.DTOs;
using Application.Core;
using Application.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.ChatRooms.Queries;

public class GetChatRoomDetails
{
    public class Query : IRequest<Result<ChatRoomDto>>
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor)
        : IRequestHandler<Query, Result<ChatRoomDto>>
    {
        public async Task<Result<ChatRoomDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var chatRoom = await context.ChatRooms
                .ProjectTo<ChatRoomDto>(
                    mapper.ConfigurationProvider,
                    new { currentUserId = userAccessor.GetUserId() }
                )
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (chatRoom == null)
                return Result<ChatRoomDto>.Failure("Chat room with provided Id not found", 404);

            return Result<ChatRoomDto>.Success(chatRoom);
        }
    }
}
