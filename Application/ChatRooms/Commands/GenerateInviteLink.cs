using Application.Core;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.WebUtilities;
using Application.Interfaces;

namespace Application.ChatRooms.Commands;

public class GenerateInviteLink
{
    public class Command : IRequest<Result<string>>
    {
        public required string Id { get; set; }
    }

    public class Handler(
        IConfiguration configuration,
        IUserAccessor userAccessor,
        IRolePermissionService rolePermissionService) 
        : IRequestHandler<Command, Result<string>>
    {
        public async Task<Result<string>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            var hasPermission = await rolePermissionService.CanCreateInviteLinkAsync(user.Id, request.Id);
            if (!hasPermission)
                return Result<string>.Failure("User don't have permission to create invite links", 403);

            var expires = DateTime.UtcNow.AddMinutes(10);
            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            var joinToken = $"{request.Id}:{token}:{expires:o}";
            var encodedToken = WebEncoders.Base64UrlEncode(System.Text.Encoding.UTF8.GetBytes(joinToken));

            var clientUrl = configuration["ClientAppUrl"];
            if (string.IsNullOrEmpty(clientUrl))
                return Result<string>.Failure("Client URL is not configured", 400);

            var url = $"{clientUrl}/chat-rooms/{request.Id}/{encodedToken}/join";
            return Result<string>.Success(url);
        }
    }
}