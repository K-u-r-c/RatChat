using System.Data;
using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Commands;

public class UpdateRoleAsync
{
    public class Command : IRequest<Result<Unit>>
    {
        public required UpdateChatRoomRoleDto UpdateChatRoomRoleDto { get; set; }
    }

    public class Handler(IChatRoomRoleService chatRoomRoleService) 
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                await chatRoomRoleService.UpdateRoleAsync(request.UpdateChatRoomRoleDto);
                return Result<Unit>.Success(Unit.Value);
            }
            catch (NoNullAllowedException ex)
            {
                return Result<Unit>.Failure(ex.Message, 400);
            }
            catch (InvalidOperationException ex)
            {
                return Result<Unit>.Failure(ex.Message, 404);
            }
        }
    }
}
