using System.Data;
using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Commands;

public class UnassignChatRoomRole
{
    public class Command : IRequest<Result<UnassignedChatRoomRoleDto>>
    {
        public required UnassignChatRoomRoleDto UnassignChatRoomRoleDto { get; set; }
    }

    public class Handler(IChatRoomRoleService chatRoomRoleService)
        : IRequestHandler<Command, Result<UnassignedChatRoomRoleDto>>
    {
        public async Task<Result<UnassignedChatRoomRoleDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                var result =
                    await chatRoomRoleService.UnassignRoleAsync(request.UnassignChatRoomRoleDto);
                return Result<UnassignedChatRoomRoleDto>.Success(result);
            }
            catch (UserNotFoundException ex)
            {
                return Result<UnassignedChatRoomRoleDto>.Failure(ex.Message, 404);
            }
            catch (ChatRoomRoleNotFoundException ex)
            {
                return Result<UnassignedChatRoomRoleDto>.Failure(ex.Message, 404);
            }
            catch
            {
                return Result<UnassignedChatRoomRoleDto>.Failure("An unexpected error occurred while unassigning role from user", 500);
            }
        }
    }
}
