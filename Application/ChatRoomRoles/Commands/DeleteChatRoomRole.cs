using System.Data;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Commands;

public class DeleteChatRoomRole
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string ChatRoomRoleId { get; set; }
    }

    public class Handler(IChatRoomRoleService chatRoomRoleService)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                await chatRoomRoleService.DeleteRoleAsync(request.ChatRoomRoleId);
                return Result<Unit>.Success(Unit.Value);
            }
            catch (ChatRoomRoleNotFoundException ex)
            {
                return Result<Unit>.Failure(ex.Message, 404);
            }
            catch (CannotDeleteDefaultRoleException ex)
            {
                return Result<Unit>.Failure(ex.Message, 404);
            }
            catch
            {
                return Result<Unit>.Failure("An unexpected error occurred while deleting chat room role", 500);
            }
        }
    }
}
