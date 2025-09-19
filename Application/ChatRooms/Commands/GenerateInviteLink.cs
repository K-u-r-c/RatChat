using Application.Core;
using Application.Interfaces;
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
        public required string Id { get; set; }
    }

    public class Handler(
        IConfiguration configuration,
        AppDbContext context)
        : IRequestHandler<Command, Result<string>>
    {
        public async Task<Result<string>> Handle(Command request, CancellationToken cancellationToken)
        {
            var chatRoom = await context.ChatRooms
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == request.Id || x.Slug == request.Id, cancellationToken);

            if (chatRoom == null)
            {
                return Result<string>.Failure("Chat room not found", 404);
            }

            var expires = DateTime.UtcNow.AddMinutes(10);
            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            var joinToken = $"{chatRoom.Id}:{token}:{expires:o}";
            var encodedToken = WebEncoders.Base64UrlEncode(System.Text.Encoding.UTF8.GetBytes(joinToken));

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