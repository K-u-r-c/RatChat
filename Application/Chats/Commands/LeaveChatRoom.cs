using Application.Core;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Chats.Commands;

public class LeaveChatRoom
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();
            var chatRoom = await context.ChatRooms
                .Include(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (chatRoom == null)
                return Result<Unit>.Failure("Chat room not found", 404);

            var membership = chatRoom.Members.FirstOrDefault(x => x.UserId == user.Id);
            if (membership == null)
                return Result<Unit>.Failure("User is not a member of this chat room", 400);

            bool isAdmin = membership.IsAdmin;

            chatRoom.Members.Remove(membership);

            if (chatRoom.Members.Count == 0)
            {
                context.ChatRooms.Remove(chatRoom);
            }
            else if (isAdmin)
            {
                var oldestMember = chatRoom.Members
                    .OrderBy(x => x.DateJoined)
                    .FirstOrDefault();

                if (oldestMember != null)
                {
                    oldestMember.IsAdmin = true;
                }
            }

            var result = await context.SaveChangesAsync(cancellationToken) > 0;
            if (!result)
                return Result<Unit>.Failure("Failed to leave chat room", 400);

            return Result<Unit>.Success(Unit.Value);
        }
    }
}