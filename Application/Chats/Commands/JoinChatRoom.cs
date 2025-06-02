using Application.Core;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;
using Microsoft.AspNetCore.WebUtilities;

namespace Application.Chats.Commands;

public class JoinChatRoom
{
    public class Command : IRequest<Result<string>>
    {
        public required string Id { get; set; }
        public required string Token { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<string>>
    {
        public async Task<Result<string>> Handle(Command request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(request.Token))
                return Result<string>.Failure("Join token is required", 400);

            try
            {
                var decodedBytes = WebEncoders.Base64UrlDecode(request.Token);
                var decoded = System.Text.Encoding.UTF8.GetString(decodedBytes);
                var parts = decoded.Split(':', 3);
                if (parts.Length != 3 || parts[0] != request.Id)
                    return Result<string>.Failure("Invalid join token", 401);

                var expires = DateTime.Parse(parts[2], null, System.Globalization.DateTimeStyles.RoundtripKind);
                if (expires < DateTime.UtcNow)
                    return Result<string>.Failure("Join link has expired", 401);
            }
            catch
            {
                return Result<string>.Failure("Invalid join token", 401);
            }

            var chatRoom = await context.ChatRooms
                .Include(x => x.Members)
                .ThenInclude(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (chatRoom == null)
                return Result<string>.Failure(
                    "Could not find this chat room or user is not part of the chat room",
                    404
                );

            var user = await userAccessor.GetUserAsync();
            var membership = chatRoom.Members.FirstOrDefault(x => x.UserId == user.Id);

            if (membership != null)
                return Result<string>.Failure("User is already part of this chat room", 401);

            chatRoom.Members.Add(new ChatRoomMember
            {
                UserId = user.Id,
                ChatRoomId = chatRoom.Id,
                IsAdmin = false
            });

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            return result
                ? Result<string>.Success(chatRoom.Id)
                : Result<string>.Failure("Problem updating the DB", 400);
        }
    }
}
