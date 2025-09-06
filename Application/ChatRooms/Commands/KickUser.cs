using Application.Core;
using Application.Interfaces;
using MediatR;
using Persistance;

namespace Application.ChatRooms.Commands;

public class KickUser
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string ChatRoomId { get; set; }
        public required string UserId { get; set; }
    }

    public class Handler(AppDbContext context, IChatRoomRoleService chatRoomRoleService)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var member = await context.ChatRoomMembers.FindAsync(
                [request.ChatRoomId, request.UserId],
                cancellationToken
            );

            if (member == null)
                return Result<Unit>.Failure("User is not a member of the chatroom", 409);
            else if (member.IsOwner)
                return Result<Unit>.Failure("Cannot kick the channel owner", 409);

            try
            {
                await chatRoomRoleService.UnassignAllUserRolesAsync(
                    request.ChatRoomId,
                    request.UserId,
                    cancellationToken);
            }
            catch (ChatRoomNotFoundException ex)
            {
                return Result<Unit>.Failure(ex.Message, 404);
            }
            catch (UserNotFoundException ex)
            {
                return Result<Unit>.Failure(ex.Message, 404);
            }

            context.ChatRoomMembers.Remove(member);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result) return Result<Unit>.Failure("Failed to kick user", 400);

            return Result<Unit>.Success(Unit.Value);
        }
    }
}
