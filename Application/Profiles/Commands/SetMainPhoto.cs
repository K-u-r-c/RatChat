using Application.Core;
using Application.Interfaces;
using MediatR;
using Domain;
using Application.Profiles.DTOs;
using Persistance;
using Microsoft.EntityFrameworkCore;
using Application.Media.Helpers;

namespace Application.Profiles.Commands;

public class SetMainPhoto
{
    public class Command : IRequest<Result<Unit>>
    {
        public required SetMainPhotoDto SetMainPhotoDto { get; set; }
    }

    public class Handler(
        IUserAccessor userAccessor,
        AppDbContext context,
        IFileStorage fileStorage)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            if (user == null)
                return Result<Unit>.Failure("User not found", 404);

            string? oldImageUrl = user.ImageUrl;
            string? oldPublicId = null;

            if (!string.IsNullOrEmpty(oldImageUrl))
            {
                oldPublicId = ExtractPublicIdFromUrl(oldImageUrl);
            }

            user.ImageUrl = request.SetMainPhotoDto.MediaUrl;

            if (!string.IsNullOrEmpty(oldPublicId))
            {
                var oldMediaFile = await context.MediaFiles
                    .FirstOrDefaultAsync(m => m.PublicId == oldPublicId, cancellationToken);

                if (oldMediaFile != null)
                {
                    oldMediaFile.ReferenceCount--;

                    if (oldMediaFile.ReferenceCount <= 0)
                    {
                        var folderPath = MediaHelpers.GetFolderPath(
                            Enum.Parse<Media.DTOs.MediaCategory>(oldMediaFile.Category),
                            user.Id);

                        await fileStorage.DeleteFileAsync(oldMediaFile.PublicId, folderPath);

                        context.MediaFiles.Remove(oldMediaFile);
                    }
                }
            }

            var newMediaFile = await context.MediaFiles
                .FirstOrDefaultAsync(m => m.PublicId == request.SetMainPhotoDto.PublicId,
                                   cancellationToken);

            if (newMediaFile != null && await IsFileUsedElsewhere(context, newMediaFile.PublicId, user.Id, cancellationToken))
            {
                newMediaFile.ReferenceCount++;
            }

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            return result
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Failed to set main photo", 400);
        }

        private static string? ExtractPublicIdFromUrl(string url)
        {
            try
            {
                var uri = new Uri(url);
                var segments = uri.Segments;
                var fileName = segments.LastOrDefault()?.TrimStart('/');
                return fileName;
            }
            catch
            {
                return null;
            }
        }

        private static async Task<bool> IsFileUsedElsewhere(AppDbContext context, string publicId, string userId, CancellationToken cancellationToken)
        {
            var isUsedByOtherUsers = await context.Users
                .AnyAsync(u => u.Id != userId && u.ImageUrl != null && u.ImageUrl.Contains(publicId),
                         cancellationToken);

            return isUsedByOtherUsers;
        }
    }
}