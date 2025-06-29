using System.Data;
using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Commands;

public class UnassignRoleAsync
{
    public class Command : IRequest<Result<Unit>>
    {
        public required UnassignChatRoomRoleDto UnassignChatRoomRoleDto { get; set; }
    }

    public class Handler(IChatRoomRoleService chatRoomRoleService) 
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                await chatRoomRoleService.UnassignRoleAsync(request.UnassignChatRoomRoleDto);
                return Result<Unit>.Success(Unit.Value);
            }
            catch (UserNotFoundException ex)
            {
                return Result<Unit>.Failure(ex.Message, 404);
            }
            catch (ChatRoomRoleNotFoundException ex)
            {
                return Result<Unit>.Failure(ex.Message, 404);
            }
            catch
            {
                return Result<Unit>.Failure("An unexpected error occurred while unassigning role from user", 500);
            }
        }
    }
}
