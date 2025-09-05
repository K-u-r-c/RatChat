using Application.Core;
using Application.ChatRooms.DTOs;
using AutoMapper;
using MediatR;
using Persistance;

namespace Application.ChatRooms.Commands;

public class UnbanUser
{
    public class Command : IRequest<Result<Unit>>
    {
        public required ChatRoomBanDto ChatRoomBanDto { get; set; }
    }

    public class Handler(AppDbContext context)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var ban = await context.ChatRoomBans.FindAsync(
                [request.ChatRoomBanDto.UserId,
                request.ChatRoomBanDto.ChatRoomId],
                cancellationToken
            );

            if (ban == null)
                return Result<Unit>.Failure("User is not banned", 404);

            context.ChatRoomBans.Remove(ban);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result)
                return Result<Unit>.Failure("Failed to unban user", 400);

            return Result<Unit>.Success(Unit.Value);
        }
    }
}