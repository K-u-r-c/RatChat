using Application.ChatRooms.DTOs;
using Application.Core;
using Application.Interfaces;
using Application.Profiles.DTOs;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.ChatRooms.Commands;

public class BanUser
{
    public class Command : IRequest<Result<UserProfileDto>>
    {
        public required ChatRoomBanDto ChatRoomBanDto { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IMapper mapper,
        IChatRoomRoleService chatRoomRoleService)
        : IRequestHandler<Command, Result<UserProfileDto>>
    {
        public async Task<Result<UserProfileDto>> Handle(
            Command request,
            CancellationToken cancellationToken)
        {
            var search_ban = await context.ChatRoomBans.FindAsync(
                [request.ChatRoomBanDto.UserId,
                request.ChatRoomBanDto.ChatRoomId],
                cancellationToken
            );

            if (search_ban != null)
                return Result<UserProfileDto>
                    .Failure("User is already banned", 409);

            var search_member =
                await context.ChatRoomMembers
                    .Include(m => m.User)
                    .FirstOrDefaultAsync(
                        m => m.UserId == request.ChatRoomBanDto.UserId &&
                        m.ChatRoomId == request.ChatRoomBanDto.ChatRoomId,
                    cancellationToken);

            if (search_member == null)
                return Result<UserProfileDto>
                    .Failure("User is not a member of the chatroom", 409);
            else if (search_member.IsOwner)
                return Result<UserProfileDto>
                    .Failure("Cannot ban the chatroom owner", 409);

            try
            {
                await chatRoomRoleService.UnassignAllUserRolesAsync(
                    request.ChatRoomBanDto.ChatRoomId,
                    request.ChatRoomBanDto.UserId,
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

            context.ChatRoomMembers.Remove(search_member);

            var ban = mapper
                .Map<ChatRoomBan>(request.ChatRoomBanDto);

            context.ChatRoomBans.Add(ban);

            var bannedUser = mapper
                .Map<UserProfileDto>(search_member.User);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result) return Result<UserProfileDto>
                .Failure("Failed to ban user", 400);

            return Result<UserProfileDto>.Success(bannedUser);
        }
    }
}
