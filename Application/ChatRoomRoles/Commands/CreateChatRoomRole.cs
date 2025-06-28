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

    public class Handler(IChatRoomRoleService chatRoomRoleService) 
        : IRequestHandler<Command, Result<ChatRoomRoleDto>>
    {
        public async Task<Result<ChatRoomRoleDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            try
            {
                var result = await chatRoomRoleService.CreateCustomRoleAsync(request.CreateChatRoomRoleDto);

                if (result != null)
                {
                    return Result<ChatRoomRoleDto>.Success(result);
                }
                else
                {
                    return Result<ChatRoomRoleDto>.Failure("Failed to create chat room role", 400);
                }
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
