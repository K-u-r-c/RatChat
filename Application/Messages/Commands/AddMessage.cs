using Application.Core;
using Application.Interfaces;
using Application.Messages.DTOs;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Messages.Commands;

public class AddMessage
{
    public class Command : IRequest<Result<MessageDto>>
    {
        public required string Body { get; set; }
        public required string ChatRoomId { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<MessageDto>>
    {
        public async Task<Result<MessageDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Body))
                return Result<MessageDto>.Failure("Can't send empty message", 422);

            var chatRoom = await context.ChatRooms
                .Include(x => x.Messages)
                .ThenInclude(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == request.ChatRoomId, cancellationToken);

            if (chatRoom == null) return Result<MessageDto>.Failure("Could not find chat room", 404);

            var user = await userAccessor.GetUserAsync();
            var message = new Message
            {
                UserId = user.Id,
                ChatRoomId = chatRoom.Id,
                Body = request.Body
            };

            chatRoom.Messages.Add(message);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            return result
                ? Result<MessageDto>.Success(mapper.Map<MessageDto>(message))
                : Result<MessageDto>.Failure("Failed to add message", 400);
        }
    }
}
