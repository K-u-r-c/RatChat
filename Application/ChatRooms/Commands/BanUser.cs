using Application.ChatRooms.DTOs;
using Application.Core;
using AutoMapper;
using Domain;
using MediatR;
using Persistance;

namespace Application.ChatRooms.Commands;

public class BanUser
{
    public class Command : IRequest<Result<Unit>>
    {
        public required ChatRoomBanDto ChatRoomBanDto { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var search_ban = await context.ChatRoomBans.FindAsync(
                [request.ChatRoomBanDto.UserId,
                request.ChatRoomBanDto.ChatRoomId],
                cancellationToken
            );

            if (search_ban != null)
                return Result<Unit>.Failure("User is already banned", 409);

            var search_member = await context.ChatRoomMembers.FindAsync(
                [request.ChatRoomBanDto.ChatRoomId,
                request.ChatRoomBanDto.UserId],
                cancellationToken
            );

            if (search_member == null)
                return Result<Unit>.Failure("User is not a member of the chatroom", 409);
            else if (search_member.IsOwner)
                return Result<Unit>.Failure("Cannot ban the chatroom owner", 409);

            context.ChatRoomMembers.Remove(search_member);

            var ban = mapper.Map<ChatRoomBan>(request.ChatRoomBanDto);
            context.ChatRoomBans.Add(ban);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result) return Result<Unit>.Failure("Failed to ban user", 400);

            return Result<Unit>.Success(Unit.Value);
        }
    }
}
