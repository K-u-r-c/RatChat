using Application.Core;
using Application.Interfaces;
using MediatR;
using Application.Profiles.DTOs;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Profiles.Commands;

public class SetProfileImage
{
    public class Command : IRequest<Result<Unit>>
    {
        public required SetProfileImageDto SetProfileImageDto { get; set; }
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

            var imageType = request.SetProfileImageDto.ImageType.ToLower();
            string? oldImageUrl = imageType == "profile" ? user.ImageUrl : user.BannerUrl;
            string? oldPublicId = null;

            if (!string.IsNullOrEmpty(oldImageUrl))
            {
                oldPublicId = ExtractPublicIdFromUrl(oldImageUrl);
            }

            if (imageType == "profile")
            {
                user.ImageUrl = request.SetProfileImageDto.MediaUrl;
            }
            else if (imageType == "banner")
            {
                user.BannerUrl = request.SetProfileImageDto.MediaUrl;
            }
            else
            {
                return Result<Unit>.Failure("Invalid image type.", 400);
            }

            if (!string.IsNullOrEmpty(oldPublicId))
            {
                var oldMediaFile = await context.MediaFiles
                    .FirstOrDefaultAsync(m => m.PublicId == oldPublicId, cancellationToken);

                if (oldMediaFile != null)
                {
                    var category = imageType == "profile"
                        ? Media.DTOs.MediaCategory.ProfileImage
                        : Media.DTOs.MediaCategory.ProfileBackground;

                    var folderPath = Media.Helpers.MediaHelpers.GetFolderPath(category, user.Id);

                    await fileStorage.DeleteFileAsync(oldMediaFile.PublicId, folderPath);
                    context.MediaFiles.Remove(oldMediaFile);
                }
            }

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            return result
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Failed to set profile image", 400);
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
    }
}