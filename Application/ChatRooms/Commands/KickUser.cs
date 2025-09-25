using Application.Core;
using Application.Interfaces;
using Application.Profiles.DTOs;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.ChatRooms.Commands;

public class KickUser
{
    public class Command : IRequest<Result<UserProfileDto>>
    {
        public required string ChatRoomId { get; set; }
        public required string UserId { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IChatRoomRoleService chatRoomRoleService,
        IMapper mapper)
        : IRequestHandler<Command, Result<UserProfileDto>>
    {
        public async Task<Result<UserProfileDto>> Handle(
            Command request,
            CancellationToken cancellationToken)
        {
            var member = await context.ChatRoomMembers
                .Include(m => m.User)
                .FirstOrDefaultAsync(
                    m => m.ChatRoomId == request.ChatRoomId
                    && m.UserId == request.UserId,
                    cancellationToken);

            if (member == null)
                return Result<UserProfileDto>
                    .Failure("User is not a member of the chatroom", 409);
            else if (member.IsOwner)
                return Result<UserProfileDto>
                    .Failure("Cannot kick the channel owner", 409);

            try
            {
                await chatRoomRoleService.UnassignAllUserRolesAsync(
                    request.ChatRoomId,
                    request.UserId,
                    cancellationToken);
            }
            catch (ChatRoomNotFoundException ex)
            {
                return Result<UserProfileDto>.Failure(ex.Message, 404);
            }
            catch (UserNotFoundException ex)
            {
                return Result<UserProfileDto>.Failure(ex.Message, 404);
            }

            context.ChatRoomMembers.Remove(member);

            var kickedUser = mapper.Map<UserProfileDto>(member.User);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result) return Result<UserProfileDto>
                .Failure("Failed to kick user", 400);

            return Result<UserProfileDto>.Success(kickedUser);
        }
    }
}
