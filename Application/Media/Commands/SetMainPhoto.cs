using System;
using Application.Core;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Application.Media.Commands;

public class SetMainPhoto
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string MediaUrl { get; set; }
    }

    public class Handler(IUserAccessor userAccessor, UserManager<User> userManager)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            if (user == null)
                return Result<Unit>.Failure("User not found", 404);

            user.ImageUrl = request.MediaUrl;

            var result = await userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return Result<Unit>.Failure("Failed to update user profile image", 400);

            return Result<Unit>.Success(Unit.Value);
        }
    }
}
