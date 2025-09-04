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

                var createdPermissions =
                    await rolePermissionService.CreatePermissionsAsync(createdRole.Id);

                createdRole.Permissions = createdPermissions;

                return Result<ChatRoomRoleDto>.Success(createdRole);
            }
            catch (ChatRoomNotFoundException ex)
            {
                return Result<ChatRoomRoleDto>.Failure(ex.Message, 404);
            }
            catch (ChatRoomRoleAlreadyExistsException ex)
            {
                return Result<ChatRoomRoleDto>.Failure(ex.Message, 409);
            }
            catch (ContextSaveOperationFailedException ex)
            {
                return Result<ChatRoomRoleDto>.Failure(ex.Message, 500);
            }
            catch (ChatRoomRoleNotFoundException ex)
            {
                return Result<ChatRoomRoleDto>.Failure(ex.Message, 500);
            }
            catch (ChatRoomPermissionsNotFoundException ex)
            {
                return Result<ChatRoomRoleDto>.Failure(ex.Message, 404);
            }
            catch
            {
                return Result<ChatRoomRoleDto>.Failure("An unexpected error occurred while creating chat room role", 500);
            }

        }
    }
}
