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
            catch (NoNullAllowedException ex)
            {
                return Result<MemberRoleDto>.Failure(ex.Message, 400);
            }
            catch (InvalidOperationException ex)
            {
                return Result<MemberRoleDto>.Failure(ex.Message, 404);
            }
        }
    }
}
