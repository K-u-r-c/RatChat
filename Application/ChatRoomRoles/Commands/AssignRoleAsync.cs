using System.Data;
using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Commands;

public class AssignRoleAsync
{
    public class Command : IRequest<Result<MemberRoleDto>>
    {
        public required AssignChatRoomRoleDto AssignChatRoomRoleDto { get; set; }
    }

    public class Handler(IChatRoomRoleService chatRoomRoleService) 
        : IRequestHandler<Command, Result<MemberRoleDto>>
    {
        public async Task<Result<MemberRoleDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                var role = await chatRoomRoleService.AssignRoleAsync(request.AssignChatRoomRoleDto);
                return Result<MemberRoleDto>.Success(role);
            }
            catch (ChatRoomNotFoundException ex)
            {
                return Result<MemberRoleDto>.Failure(ex.Message, 404);
            }
            catch (UserNotFoundException ex)
            {
                return Result<MemberRoleDto>.Failure(ex.Message, 404);
            }
            catch (ChatRoomRoleNotFoundException ex)
            {
                return Result<MemberRoleDto>.Failure(ex.Message, 404);
            }
            catch (UserAlreadyHasRoleException ex)
            {
                return Result<MemberRoleDto>.Failure(ex.Message, 400);
            }
            catch
            {
                return Result<MemberRoleDto>.Failure("An unexpected error occurred while assigning role to user", 500);
            }
        }
    }
}
