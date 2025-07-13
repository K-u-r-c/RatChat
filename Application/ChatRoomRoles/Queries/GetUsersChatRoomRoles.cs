using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Queries;

public class GetUsersChatRoomRoles
{
    public class Query : IRequest<Result<Dictionary<string, List<ChatRoomRoleDto>>>>
    {
        public required string ChatRoomId { get; set; }
    }

    public class Handler(
        IChatRoomRoleService chatRoomRoleService) 
        : IRequestHandler<Query, Result<Dictionary<string, List<ChatRoomRoleDto>>>>
    {
        public async Task<Result<Dictionary<string, List<ChatRoomRoleDto>>>>
        Handle(Query request, CancellationToken cancellationToken)
        {
            try
            {
                var roles = await chatRoomRoleService.GetUsersRolesAsync(request.ChatRoomId);
                
                return Result<Dictionary<string, List<ChatRoomRoleDto>>>.Success(roles);
            }
            catch (ChatRoomNotFoundException ex)
            {
                return Result<Dictionary<string, List<ChatRoomRoleDto>>>.Failure(ex.Message, 404);
            }
            catch
            {
                return Result<Dictionary<string, List<ChatRoomRoleDto>>>
                .Failure("An unexpected error occurred while retrieving users' chatroom roles", 500);
            }
        }
    }
}

