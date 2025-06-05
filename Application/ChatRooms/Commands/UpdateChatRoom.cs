using Application.ChatRooms.DTOs;
using Application.Core;
using AutoMapper;
using MediatR;
using Persistance;

namespace Application.ChatRooms.Commands;

public class EditChatRoom
{
    public class Command : IRequest<Result<Unit>>
    {
        public required EditChatRoomDto ChatRoomDto { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var chatRoom = await context.ChatRooms
                .FindAsync([request.ChatRoomDto.Id], cancellationToken);

            if (chatRoom == null) return Result<Unit>.Failure("Chat room not found", 404);

            mapper.Map(request.ChatRoomDto, chatRoom);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            return result
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Failed to edit chat room", 400);
        }
    }
}
