using Application.Core;
using Application.Interfaces;
using Application.Media.DTOs;
using Application.Media.Helpers;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Application.Media.Commands;

public class DeleteMedia
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string PublicId { get; set; }
        public MediaCategory Category { get; set; }
    }

    public class Handler(IFileStorage fileStorage, IUserAccessor userAccessor, UserManager<User> userManager)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();
            var folder = MediaHelpers.GetFolderName(request.Category);

            var deleteResult = await fileStorage.DeleteFileAsync(request.PublicId, folder);

            if (!deleteResult.IsSuccess)
                return Result<Unit>.Failure(deleteResult.Error!, deleteResult.Code);

            if (request.Category == MediaCategory.ProfileImage &&
                user.ImageUrl?.Contains(request.PublicId) == true)
            {
                user.ImageUrl = null;
                await userManager.UpdateAsync(user);
            }

            return Result<Unit>.Success(Unit.Value);
        }
    }
}