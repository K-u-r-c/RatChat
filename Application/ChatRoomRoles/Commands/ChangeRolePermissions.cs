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
        public required List<ChangeRolePermissionDto> ChangeRolePermissionDtos { get; set; }
    }

    public class Handler(IRolePermissionService rolePermissionService) 
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                await rolePermissionService.ChangePermissionsAsync(request.RoleId, request.ChangeRolePermissionDtos);
                return Result<Unit>.Success(Unit.Value);
            }
            catch (Exception ex)
            {
                return Result<Unit>.Failure("Failed to change role permissions: " + ex.Message, 400);
            }
        }
    }
}
