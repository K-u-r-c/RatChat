using System.Data;
using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Queries;

public class GetUserChatRoomRoles
{
    public class Query : IRequest<Result<List<ChatRoomRoleDto>>>
    {
        public required string ChatRoomId { get; set; }
        public required string UserId { get; set; }
    }

    public class Handler(
        IChatRoomRoleService chatRoomRoleService,
        IRolePermissionService rolePermissionService) 
        : IRequestHandler<Query, Result<List<ChatRoomRoleDto>>>
    {
        public async Task<Result<List<ChatRoomRoleDto>>> Handle(Query request, CancellationToken cancellationToken)
        {
            try
            {
                var roles = await chatRoomRoleService.GetRolesAsync(request.ChatRoomId, request.UserId);

                foreach (var role in roles)
                {
                    var permissions = await rolePermissionService.GetPermissionsAsync(role.Id);
                    role.Permissions = permissions;
                }

                return Result<List<ChatRoomRoleDto>>.Success(roles);
            }
            catch (ChatRoomNotFoundException ex)
            {
                return Result<List<ChatRoomRoleDto>>.Failure(ex.Message, 404);
            }
            catch (UserNotFoundException ex)
            {
                return Result<List<ChatRoomRoleDto>>.Failure(ex.Message, 404);
            }
            catch (ChatRoomRoleNotFoundException ex)
            {
                return Result<List<ChatRoomRoleDto>>.Failure(ex.Message, 500);
            }
            catch
            {
                return Result<List<ChatRoomRoleDto>>.Failure("An unexpected error occurred while " +
                "retrieving user's chatroom roles", 500);
            }
        }
    }
}
