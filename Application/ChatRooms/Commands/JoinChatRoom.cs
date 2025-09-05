using Application.Core;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;
using Microsoft.AspNetCore.WebUtilities;

namespace Application.ChatRooms.Commands;

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

            bool isValidToken = false;
            bool usedInviteFlow = false;
            Domain.ChatRoomInvite? invite = null;

            try
            {
                var decodedBytes = WebEncoders.Base64UrlDecode(request.Token);
                var decoded = System.Text.Encoding.UTF8.GetString(decodedBytes);
                var parts = decoded.Split(':');

                // New format: inviteId:secret
                if (parts.Length == 2)
                {
                    usedInviteFlow = true;
                    var inviteId = parts[0];
                    var secret = parts[1];

                    invite = await context.ChatRoomInvites
                        .FirstOrDefaultAsync(i => i.Id == inviteId && i.Secret == secret, cancellationToken);

                    if (invite == null || invite.ChatRoomId != request.Id || invite.Revoked)
                        return Result<string>.Failure("Invalid join token", 401);

                    if (invite.ExpiresAt.HasValue && invite.ExpiresAt.Value < DateTime.UtcNow)
                        return Result<string>.Failure("Join link has expired", 401);

                    isValidToken = true;
                }
                // Legacy format: chatRoomId:randomToken:expires
                else if (parts.Length == 3 && parts[0] == request.Id)
                {
                    var expires = DateTime.Parse(parts[2], null, System.Globalization.DateTimeStyles.RoundtripKind);
                    if (expires < DateTime.UtcNow)
                        return Result<string>.Failure("Join link has expired", 401);

                    isValidToken = true;
                }
            }
            catch
            {
                return Result<string>.Failure("Invalid join token", 401);
            }

            if (!isValidToken)
                return Result<string>.Failure("Invalid join token", 401);

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

            // Enforce invite constraints if used
            if (usedInviteFlow && invite != null)
            {
                if (!string.IsNullOrEmpty(invite.AllowedUserId) && invite.AllowedUserId != user.Id)
                    return Result<string>.Failure("This invite is not for you", 403);

                if (invite.MaxUses.HasValue && invite.Uses >= invite.MaxUses.Value)
                    return Result<string>.Failure("This invite has reached its usage limit", 401);

                invite.Uses += 1;
            }

            chatRoom.Members.Add(new ChatRoomMember
            {
                UserId = user.Id,
                ChatRoomId = chatRoom.Id,
                IsOwner = false
            });

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            return result
                ? Result<string>.Success(chatRoom.Id)
                : Result<string>.Failure("Problem updating the DB", 400);
        }
    }
}
