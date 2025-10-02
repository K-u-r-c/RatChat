using System.Net;
using System.Security.Cryptography;
using Application.Core;
using Application.DirectChats.Commands;
using Application.DirectMessages.Commands;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Persistance;

namespace Application.ChatRooms.Commands;

public class CreateInvite
{
    public class Command : IRequest<Result<string>>
    {
        // Set from route. Not required in JSON body to avoid deserialization failures.
        public string Id { get; set; } = string.Empty; // ChatRoomId or slug
        public string? AllowedUserId { get; set; }
        public int? MaxUses { get; set; }
        public int? ExpiresInMinutes { get; set; }
        public bool SendToFriend { get; set; } = true;
    }

    public class Handler(
        AppDbContext context,
        IUserAccessor userAccessor,
        IConfiguration configuration,
        IMediator mediator,
        IDirectMessagesNotificationService directMessagesNotificationService)
        : IRequestHandler<Command, Result<string>>
    {
        public async Task<Result<string>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            var chatRoom = await context.ChatRooms
                .AsNoTracking()
                .Include(x => x.Bans)
                .FirstOrDefaultAsync(x => x.Id == request.Id || x.Slug == request.Id, cancellationToken);
            if (chatRoom == null)
                return Result<string>.Failure("Chat room not found", 404);

            // Default expiration: 10 minutes if not specified
            var effectiveExpiryMinutes = request.ExpiresInMinutes ?? 10;
            var expiresAt = effectiveExpiryMinutes > 0
                ? DateTime.UtcNow.AddMinutes(effectiveExpiryMinutes)
                : (DateTime?)null;

            var ban = chatRoom.Bans.FirstOrDefault(
                b => b.UserId == request.AllowedUserId && b.ChatRoomId == chatRoom.Id);

            if (ban != null)
            {
                return Result<string>.Failure("That user is banned from this chat room", 401);
            }

            var maxUses = string.IsNullOrEmpty(request.AllowedUserId) ? request.MaxUses : 1;

            var invite = new Domain.ChatRoomInvite
            {
                Id = Guid.NewGuid().ToString(),
                ChatRoomId = chatRoom.Id,
                CreatedByUserId = user.Id,
                Secret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16)),
                AllowedUserId = request.AllowedUserId,
                MaxUses = maxUses,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow
            };

            context.ChatRoomInvites.Add(invite);
            var saved = await context.SaveChangesAsync(cancellationToken) > 0;
            if (!saved)
                return Result<string>.Failure("Failed to create invite", 400);

            var tokenPayload = $"{invite.Id}:{invite.Secret}";
            var encodedToken = WebEncoders.Base64UrlEncode(System.Text.Encoding.UTF8.GetBytes(tokenPayload));

            var clientUrl = configuration["ClientAppUrl"];
            if (string.IsNullOrEmpty(clientUrl))
                return Result<string>.Failure("Client URL is not configured", 400);

            var url = $"{clientUrl}/chat-rooms/{chatRoom.Slug}/{encodedToken}/join";

            // Optionally auto-send direct message to the friend
            if (!string.IsNullOrEmpty(request.AllowedUserId) && request.SendToFriend)
            {
                // Ensure direct chat exists
                var directChatResult = await mediator.Send(new CreateDirectChat.Command
                {
                    OtherUserId = request.AllowedUserId!
                }, cancellationToken);

                if (directChatResult.IsSuccess)
                {
                    // Send message with the invite link
                    var safeTitle = WebUtility.HtmlEncode(chatRoom.Title);
                    var messageBody = $"You have been invited to join the chat room '{safeTitle}'. Click to join: {url}";
                    var sent = await mediator.Send(new SendDirectMessage.Command
                    {
                        DirectChatId = directChatResult.Value!,
                        Body = messageBody,
                        Type = "Text"
                    }, cancellationToken);

                    if (sent.IsSuccess && sent.Value != null)
                    {
                        await directMessagesNotificationService.NotifyNewMessage(directChatResult.Value!, sent.Value, broadcastToDirectChat: true);
                    }
                }
            }

            return Result<string>.Success(url);
        }
    }
}
