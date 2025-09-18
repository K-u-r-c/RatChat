using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Commands;

public class ChangeRolePermissions
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string RoleId { get; set; }
        public required List<UpdateRolePermissionDto> ChangeRolePermissionDtos { get; set; }
    }

    public class Handler(IRolePermissionService rolePermissionService)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                await rolePermissionService.UpdatePermissionsAsync(request.RoleId, request.ChangeRolePermissionDtos);
                return Result<Unit>.Success(Unit.Value);
            }
            catch (ChatRoomRoleNotFoundException ex)
            {
                return Result<Unit>.Failure(ex.Message, 404);
            }
            catch (ChatRoomPermissionsNotFoundException ex)
            {
                return Result<Unit>.Failure(ex.Message, 404);
            }
            catch
            {
                return Result<Unit>.Failure("An unexpected error occurred while changing role permissions", 500);
            }
        }
    }
}
