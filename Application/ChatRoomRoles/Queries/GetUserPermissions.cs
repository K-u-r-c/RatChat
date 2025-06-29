using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Queries;

public class GetUserPermissions
{
    public class Query : IRequest<Result<List<ChatRoomPermissionDto>>>
    {
        public required string ChatRoomId { get; set; }
        public required string UserId { get; set; }
    }

    public class Handler(IRolePermissionService rolePermissionService) 
        : IRequestHandler<Query, Result<List<ChatRoomPermissionDto>>>
    {
        public async Task<Result<List<ChatRoomPermissionDto>>> Handle(Query request, CancellationToken cancellationToken)
        {
            try
            {
                var permissions = await rolePermissionService.GetUserPermissionsAsync(request.UserId, request.ChatRoomId);
                return Result<List<ChatRoomPermissionDto>>.Success(permissions);
            }
            catch (ChatRoomNotFoundException ex)
            {
                return Result<List<ChatRoomPermissionDto>>.Failure(ex.Message, 404);
            }
            catch (UserNotFoundException ex)
            {
                return Result<List<ChatRoomPermissionDto>>.Failure(ex.Message, 404);
            }
            catch
            {
                return Result<List<ChatRoomPermissionDto>>.Failure("An unexpected error occurred while " +
                "retrieving user's chatroom permissions", 500);
            }
        }
    }
}
