using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Commands;

public class CreateChatRoomRole
{
    public class Command : IRequest<Result<ChatRoomRoleDto>>
    {
        public required CreateChatRoomRoleDto CreateChatRoomRoleDto { get; set; }
    }

    public class Handler(
        IChatRoomRoleService chatRoomRoleService,
        IRolePermissionService rolePermissionService) 
        : IRequestHandler<Command, Result<ChatRoomRoleDto>>
    {
        public async Task<Result<ChatRoomRoleDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                var createdRole = await chatRoomRoleService.CreateCustomRoleAsync(request.CreateChatRoomRoleDto);

                if (createdRole == null)
                    return Result<ChatRoomRoleDto>.Failure("Failed to create chat room role", 400);

                var createdPermissions = await rolePermissionService.CreatePermissionsAsync(createdRole.Id);

                if (createdPermissions == null || createdPermissions.Count == 0)
                    return Result<ChatRoomRoleDto>.Failure("Failed to create permissions for the role", 400);

                createdRole.Permissions = createdPermissions;

                return Result<ChatRoomRoleDto>.Success(createdRole);
            }
            catch (ArgumentException ex)
            {
                return Result<ChatRoomRoleDto>.Failure(ex.Message, 400);
            }
            catch (Exception ex)
            {
                return Result<ChatRoomRoleDto>.Failure("An unexpected error occurred: " + ex.Message, 500);
            }
        }
    }
}
