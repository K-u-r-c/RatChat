using Application.Core;
using MediatR;
using Persistance;

namespace Application.Chats.Commands;

public class DeleteChatRoom
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var chatRoom = await context.ChatRooms
                .FindAsync([request.Id], cancellationToken);

            if (chatRoom == null)
                return Result<Unit>.Failure("Could not find chat room for deletion", 404);

            context.Remove(chatRoom);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result)
                return Result<Unit>.Failure("Failed to delete chat room", 400);

            return Result<Unit>.Success(Unit.Value);
        }
    }
}
