using Application.Core;
using Application.Interfaces;
using Application.Profiles.DTOs;
using Application.Users.Helpers;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Domain;

namespace Application.Profiles.Commands;

public class UpdateProfile
{
    public class Command : IRequest<Result<Unit>>
    {
        public required UpdateProfileDto UpdateProfileDto { get; set; }
    }

    public class Handler(IUserAccessor userAccessor, UserManager<User> userManager)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            if (!string.IsNullOrEmpty(request.UpdateProfileDto.DisplayName))
            {
                var newDisplayName = request.UpdateProfileDto.DisplayName.Trim();
                if (!string.Equals(newDisplayName, user.DisplayName, StringComparison.Ordinal))
                {
                    user.DisplayName = newDisplayName;
                }
            }

            if (string.IsNullOrWhiteSpace(user.Slug))
            {
                user.Slug = await UserSlugGenerator.GenerateUniqueSlugAsync(
                    userManager.Users,
                    user.Id,
                    cancellationToken);
            }

            if (request.UpdateProfileDto.Bio != null)
                user.Bio = request.UpdateProfileDto.Bio;

            var result = await userManager.UpdateAsync(user);

            return result.Succeeded
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Failed to update profile", 400);
        }
    }
}
