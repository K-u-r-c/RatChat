using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Commands;

public class AssignChatRoomRole
{
    public class Command : IRequest<Result<AssignedChatRoomRoleDto>>
    {
        public required AssignChatRoomRoleDto AssignChatRoomRoleDto { get; set; }
    }

    public class Handler(IChatRoomRoleService chatRoomRoleService) 
        : IRequestHandler<Command, Result<AssignedChatRoomRoleDto>>
    {
        public async Task<Result<AssignedChatRoomRoleDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                var role = await chatRoomRoleService.AssignRoleAsync(request.AssignChatRoomRoleDto);
                return Result<AssignedChatRoomRoleDto>.Success(role);
            }
            catch (ChatRoomNotFoundException ex)
            {
                return Result<AssignedChatRoomRoleDto>.Failure(ex.Message, 404);
            }
            catch (UserNotFoundException ex)
            {
                return Result<AssignedChatRoomRoleDto>.Failure(ex.Message, 404);
            }
            catch (ChatRoomRoleNotFoundException ex)
            {
                return Result<AssignedChatRoomRoleDto>.Failure(ex.Message, 404);
            }
            catch (UserAlreadyHasRoleException ex)
            {
                return Result<AssignedChatRoomRoleDto>.Failure(ex.Message, 400);
            }
            catch
            {
                return Result<AssignedChatRoomRoleDto>
                .Failure("An unexpected error occurred while assigning role to user", 500);
            }
        }
    }
}
