using System.Security.Cryptography;
using System.Text;
using Application.Core;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Persistance;

namespace Application.ChatRooms.Commands;

public class GenerateInviteLink
{
    public class Command : IRequest<Result<string>>
    {
        public string Id { get; set; } = string.Empty;
        public int? MaxUses { get; set; }
        public int? ExpiresInMinutes { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IUserAccessor userAccessor,
        IConfiguration configuration)
        : IRequestHandler<Command, Result<string>>
    {
        public async Task<Result<string>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            var chatRoom = await context.ChatRooms
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == request.Id || x.Slug == request.Id, cancellationToken);

            if (chatRoom == null)
            {
                return Result<string>.Failure("Chat room not found", 404);
            }

            var effectiveExpiryMinutes = request.ExpiresInMinutes ?? 10;
            var expiresAt = effectiveExpiryMinutes > 0
                ? DateTime.UtcNow.AddMinutes(effectiveExpiryMinutes)
                : (DateTime?)null;

            var invite = new ChatRoomInvite
            {
                Id = Guid.NewGuid().ToString(),
                ChatRoomId = chatRoom.Id,
                CreatedByUserId = user.Id,
                Secret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16)),
                MaxUses = request.MaxUses,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow
            };

            context.ChatRoomInvites.Add(invite);
            var saved = await context.SaveChangesAsync(cancellationToken) > 0;
            if (!saved)
            {
                return Result<string>.Failure("Failed to create invite", 400);
            }

            var tokenPayload = $"{invite.Id}:{invite.Secret}";
            var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(tokenPayload));

            var clientUrl = configuration["ClientAppUrl"];
            if (string.IsNullOrEmpty(clientUrl))
            {
                return Result<string>.Failure("Client URL is not configured", 400);
            }

            var url = $"{clientUrl}/chat-rooms/{chatRoom.Slug}/{encodedToken}/join";
            return Result<string>.Success(url);
        }
    }
}
