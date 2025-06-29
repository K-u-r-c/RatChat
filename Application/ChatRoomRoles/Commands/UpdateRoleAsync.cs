using System.Data;
using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Commands;

public class UpdateRoleAsync
{
    public class Command : IRequest<Result<Unit>>
    {
        public required UpdateChatRoomRoleDto UpdateChatRoomRoleDto { get; set; }
    }

    public class Handler(
        IChatRoomRoleService chatRoomRoleService,
        IRolePermissionService rolePermissionService) 
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                await chatRoomRoleService.UpdateRoleAsync(request.UpdateChatRoomRoleDto);

                await rolePermissionService.ChangePermissionsAsync(request.UpdateChatRoomRoleDto.Id,
                    request.UpdateChatRoomRoleDto.Permissions);

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
            catch (ContextSaveOperationFailedException ex)
            {
                return Result<Unit>.Failure(ex.Message, 500);
            }
            catch
            {
                return Result<Unit>.Failure("An unexpected error occurred while updating chat room role", 500);
            }
        }
    }
}
