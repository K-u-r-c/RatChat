using Application.Core;
using Application.ChatRooms.DTOs;
using MediatR;
using Persistance;
using Application.Profiles.DTOs;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace Application.ChatRooms.Commands;

public class UnbanUser
{
    public class Command : IRequest<Result<UserProfileDto>>
    {
        public required ChatRoomBanDto ChatRoomBanDto { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IMapper mapper)
        : IRequestHandler<Command, Result<UserProfileDto>>
    {
        public async Task<Result<UserProfileDto>> Handle(
            Command request,
            CancellationToken cancellationToken)
        {
            var ban = await context.ChatRoomBans
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    crb => crb.UserId == request.ChatRoomBanDto.UserId &&
                    crb.ChatRoomId == request.ChatRoomBanDto.ChatRoomId,
                    cancellationToken
                );

            if (ban == null)
                return Result<UserProfileDto>.Failure("User is not banned", 404);

            context.ChatRoomBans.Remove(ban);

            var unbannedUser = mapper.Map<UserProfileDto>(ban.User);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result)
                return Result<UserProfileDto>.Failure("Failed to unban user", 400);

            return Result<UserProfileDto>.Success(unbannedUser);
        }
    }
}