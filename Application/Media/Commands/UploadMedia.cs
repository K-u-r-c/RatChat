using Application.Core;
using Application.Interfaces;
using Application.Media.DTOs;
using Application.Media.Helpers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

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
        IMediaValidator mediaValidator,
        AppDbContext context)
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

            if (MediaHelpers.IsChatRoomMedia(category) && !string.IsNullOrEmpty(request.MediaUploadDto.ChatRoomId))
            {
                var hasAccess = await context.ChatRoomMembers
                    .AnyAsync(m => m.ChatRoomId == request.MediaUploadDto.ChatRoomId &&
                                  m.UserId == user.Id, cancellationToken);

                if (!hasAccess)
                    return Result<MediaUploadResultDto>.Failure("User does not have access to this chat room", 403);
            }

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

            var folderPath = MediaHelpers.GetFolderPath(
                category,
                user.Id,
                request.MediaUploadDto.ChatRoomId,
                request.MediaUploadDto.ChannelId);

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{fileExtension}";

            using var stream = file.OpenReadStream();
            var uploadResult = await fileStorage.UploadFileAsync(stream, fileName, file.ContentType, folderPath);

            if (!uploadResult.IsSuccess)
                return Result<MediaUploadResultDto>.Failure(uploadResult.Error!, uploadResult.Code);

            var mediaFile = new Domain.MediaFile
            {
                Id = Guid.NewGuid().ToString(),
                PublicId = fileName,
                Url = uploadResult.Value!,
                MediaType = file.ContentType,
                FileSize = file.Length,
                OriginalFileName = file.FileName,
                Category = category.ToString(),
                ChatRoomId = request.MediaUploadDto.ChatRoomId,
                ChannelId = request.MediaUploadDto.ChannelId,
                UploadedById = user.Id,
                CreatedAt = DateTime.UtcNow
            };

            context.MediaFiles.Add(mediaFile);
            await context.SaveChangesAsync(cancellationToken);

            return Result<MediaUploadResultDto>.Success(new MediaUploadResultDto
            {
                Url = uploadResult.Value!,
                PublicId = fileName,
                MediaType = file.ContentType,
                FileSize = file.Length,
                OriginalFileName = file.FileName,
                Category = category,
                ChatRoomId = request.MediaUploadDto.ChatRoomId,
                ChannelId = request.MediaUploadDto.ChannelId
            });
        }
    }
}