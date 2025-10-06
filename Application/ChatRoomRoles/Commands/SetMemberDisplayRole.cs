using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Commands;

public class SetMemberDisplayRole
{
    public class Command : IRequest<Result<MemberDisplayRoleDto>>
    {
        public required SetMemberDisplayRoleDto Dto { get; set; }
    }

    public class Handler(IChatRoomRoleService chatRoomRoleService) : IRequestHandler<Command, Result<MemberDisplayRoleDto>>
    {
        public async Task<Result<MemberDisplayRoleDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                var result = await chatRoomRoleService.SetMemberDisplayRoleAsync(request.Dto);
                return Result<MemberDisplayRoleDto>.Success(result);
            }
            catch (ChatRoomNotFoundException ex)
            {
                return Result<MemberDisplayRoleDto>.Failure(ex.Message, 404);
            }
            catch (UserNotFoundException ex)
            {
                return Result<MemberDisplayRoleDto>.Failure(ex.Message, 404);
            }
            catch (ChatRoomMemberNotFoundException ex)
            {
                return Result<MemberDisplayRoleDto>.Failure(ex.Message, 404);
            }
            catch (ChatRoomRoleNotFoundException ex)
            {
                return Result<MemberDisplayRoleDto>.Failure(ex.Message, 404);
            }
            catch (UserDoesNotHaveRoleException ex)
            {
                return Result<MemberDisplayRoleDto>.Failure(ex.Message, 400);
            }
            catch (Exception)
            {
                return Result<MemberDisplayRoleDto>.Failure("Failed to update member display role", 500);
            }
        }
    }
}
