using Application.Core;
using Application.Interfaces;
using Application.Media.DTOs;
using Application.Media.Helpers;
using MediatR;

namespace Application.Media.Commands;

public class UploadMedia
{
    public class Command : IRequest<Result<MediaUploadResultDto>>
    {
        public required MediaUploadDto MediaUploadDto { get; set; }
    }

    public class Handler(
        IFileStorage fileStorage,
        IUserAccessor userAccessor,
        IMediaValidator mediaValidator)
        : IRequestHandler<Command, Result<MediaUploadResultDto>>
    {
        public async Task<Result<MediaUploadResultDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            if (user == null)
                return Result<MediaUploadResultDto>.Failure("User not found", 404);

            var file = request.MediaUploadDto.File;
            var category = request.MediaUploadDto.Category;

            if (file == null || file.Length == 0)
                return Result<MediaUploadResultDto>.Failure("No file provided", 400);

            if (!mediaValidator.IsValidMediaType(file.ContentType, category))
            {
                var allowedExtensions = string.Join(", ", mediaValidator.GetAllowedExtensions(category));
                return Result<MediaUploadResultDto>.Failure(
                    $"Invalid file type for {category}. Allowed types: {allowedExtensions}", 400);
            }

            if (!mediaValidator.IsValidFileSize(file.Length, category))
            {
                var maxSize = mediaValidator.GetMaxFileSize(category) / (1024 * 1024);
                return Result<MediaUploadResultDto>.Failure(
                    $"File size must be less than {maxSize}MB for {category}", 400);
            }

            var folder = MediaHelpers.GetFolderName(category);

            if (string.IsNullOrEmpty(folder))
                return Result<MediaUploadResultDto>.Failure("Invalid media category", 400);

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{user.Id}_{Guid.NewGuid()}{fileExtension}";

            using var stream = file.OpenReadStream();
            var uploadResult =
                await fileStorage.UploadFileAsync(stream, fileName, file.ContentType, folder);

            if (!uploadResult.IsSuccess)
                return Result<MediaUploadResultDto>.Failure(uploadResult.Error!, uploadResult.Code);

            return Result<MediaUploadResultDto>.Success(new MediaUploadResultDto
            {
                Url = uploadResult.Value!,
                PublicId = fileName,
                MediaType = file.ContentType,
                FileSize = file.Length,
                OriginalFileName = file.FileName
            });
        }
    }
}
