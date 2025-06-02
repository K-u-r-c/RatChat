using Application.Core;
using MediatR;
using Microsoft.Extensions.Configuration;

namespace Application.Chats.Commands;

public class GenerateInviteLink
{
    public class Command : IRequest<Result<string>>
    {
        public required string Id { get; set; }
    }

    public class Handler(IConfiguration configuration) : IRequestHandler<Command, Result<string>>
    {
        public Task<Result<string>> Handle(Command request, CancellationToken cancellationToken)
        {
            var expires = DateTime.UtcNow.AddMinutes(10);
            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            var joinToken = $"{request.Id}:{token}:{expires:o}";
            var encodedToken = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(joinToken));

            var clientUrl = configuration["ClientAppUrl"];
            if (string.IsNullOrEmpty(clientUrl))
                return Task.FromResult(Result<string>.Failure("Client URL is not configured", 400));

            var url = $"{clientUrl}/chat-rooms/{request.Id}/{encodedToken}/join";
            return Task.FromResult(Result<string>.Success(url));
        }
    }
}
