using Application.ChatRoomRoles.DTOs;
using Application.Core;
using Application.Interfaces;
using MediatR;

namespace Application.ChatRoomRoles.Commands;

public class ReorderChatRoomRoles
{
    public class Command : IRequest<Result<List<ChatRoomRoleDto>>>
    {
        public required ReorderChatRoomRolesDto Dto { get; set; }
    }

    public class Handler(IChatRoomRoleService chatRoomRoleService)
        : IRequestHandler<Command, Result<List<ChatRoomRoleDto>>>
    {
        public async Task<Result<List<ChatRoomRoleDto>>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                var reordered = await chatRoomRoleService.ReorderRolesAsync(
                    request.Dto.ChatRoomId,
                    request.Dto.OrderedRoleIds);

                return Result<List<ChatRoomRoleDto>>.Success(reordered);
            }
            catch (ChatRoomNotFoundException ex)
            {
                return Result<List<ChatRoomRoleDto>>.Failure(ex.Message, 404);
            }
            catch (ChatRoomRoleNotFoundException ex)
            {
                return Result<List<ChatRoomRoleDto>>.Failure(ex.Message, 404);
            }
            catch (ArgumentException ex)
            {
                return Result<List<ChatRoomRoleDto>>.Failure(ex.Message, 400);
            }
            catch
            {
                return Result<List<ChatRoomRoleDto>>.Failure(
                    "An unexpected error occurred while reordering chat room roles.",
                    500);
            }
        }
    }
}