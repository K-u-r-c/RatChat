using System.Data;
using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Queries;

public class GetChatRoomRoles
{
    public class Query : IRequest<Result<List<ChatRoomRoleDto>>>
    {
        public required string ChatRoomId { get; set; }
    }

    public class Handler(IChatRoomRoleService chatRoomRoleService)
        : IRequestHandler<Query, Result<List<ChatRoomRoleDto>>>
    {
        public async Task<Result<List<ChatRoomRoleDto>>> Handle(Query request, CancellationToken cancellationToken)
        {
            try
            {
                var roles = await chatRoomRoleService.GetRolesAsync(request.ChatRoomId);
                return Result<List<ChatRoomRoleDto>>.Success(roles);
            }
            catch (NoNullAllowedException ex)
            {
                return Result<List<ChatRoomRoleDto>>.Failure(ex.Message, 400);
            }
            catch (InvalidOperationException ex)
            {
                return Result<List<ChatRoomRoleDto>>.Failure(ex.Message, 404);
            }
        }
    }
}
