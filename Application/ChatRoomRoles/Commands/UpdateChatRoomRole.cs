using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using Domain.Enums;
using MediatR;

namespace Application.ChatRoomRoles.Commands;

public class UpdateChatRoomRole
{
    public class Command : IRequest<Result<ChatRoomRoleDto>>
    {
        public required UpdateChatRoomRoleDto UpdateChatRoomRoleDto { get; set; }
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
                await chatRoomRoleService.UpdateRoleAsync(request.UpdateChatRoomRoleDto);

                await rolePermissionService.UpdatePermissionsAsync(
                    request.UpdateChatRoomRoleDto.Id,
                    request.UpdateChatRoomRoleDto.Permissions);
                
                var updatedRole = await
                    chatRoomRoleService.GetRoleAsync(request.UpdateChatRoomRoleDto.Id);

                if (updatedRole == null)
                {
                    return Result<ChatRoomRoleDto>.Failure("Chat room role not found", 404);
                }

                var updatedPermissions = await
                    rolePermissionService.GetPermissionsAsync(updatedRole.Id);

                if (updatedPermissions == null ||
                    updatedPermissions.Count != ChatRoomPermissions.All.Count)
                {
                    return Result<ChatRoomRoleDto>.Failure("Chat room permissions not found", 404);
                }
                updatedRole.Permissions = updatedPermissions;

                return Result<ChatRoomRoleDto>.Success(updatedRole);
            }
            catch (ChatRoomRoleNotFoundException ex)
            {
                return Result<ChatRoomRoleDto>.Failure(ex.Message, 404);
            }
            catch (ChatRoomPermissionsNotFoundException ex)
            {
                return Result<ChatRoomRoleDto>.Failure(ex.Message, 404);
            }
            catch (ContextSaveOperationFailedException ex)
            {
                return Result<ChatRoomRoleDto>.Failure(ex.Message, 500);
            }
            catch
            {
                return Result<ChatRoomRoleDto>.Failure("An unexpected error occurred while updating chat room role", 500);
            }
        }
    }
}
