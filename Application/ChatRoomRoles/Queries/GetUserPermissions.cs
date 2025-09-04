using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Queries;

public class GetUserPermissions
{
    public class Query : IRequest<Result<UserPermissionsDto>>
    {
        public required string ChatRoomId { get; set; }
        public required string UserId { get; set; }
    }

    public class Handler(IRolePermissionService rolePermissionService)
        : IRequestHandler<Query, Result<UserPermissionsDto>>
    {
        public async Task<Result<UserPermissionsDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            try
            {
                var permissions = await rolePermissionService.GetUserPermissionsAsync(request.UserId, request.ChatRoomId);
                return Result<UserPermissionsDto>.Success(permissions);
            }
            catch (ChatRoomNotFoundException ex)
            {
                return Result<UserPermissionsDto>.Failure(ex.Message, 404);
            }
            catch (UserNotFoundException ex)
            {
                return Result<UserPermissionsDto>.Failure(ex.Message, 404);
            }
            catch
            {
                return Result<UserPermissionsDto>.Failure("An unexpected error occurred while " +
                "retrieving user's chatroom permissions", 500);
            }
        }
    }
}
