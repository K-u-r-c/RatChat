using Application.Core;
using Application.Interfaces;
using Application.Media.DTOs;
using Application.Media.Helpers;
using MediatR;

namespace Application.Media.Queries;

public class GetMedia
{
    public class Query : IRequest<Result<MediaGetDto>>
    {
        public required string PublicId { get; set; }
        public required string Folder { get; set; }
    }

    public class Handler(IFileStorage fileStorage) : IRequestHandler<Query, Result<MediaGetDto>>
    {
        public async Task<Result<MediaGetDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(request.PublicId))
                return Result<MediaGetDto>.Failure("Id cannot be null or empty", 400);

            var media = string.IsNullOrEmpty(request.Folder)
                ? await fileStorage.GetFileAsync(request.PublicId)
                : await fileStorage.GetFileAsync(request.PublicId, request.Folder);

            if (media == null || media.Value == null)
                return Result<MediaGetDto>.Failure("Media not found", 404);

            var fileSize = await MediaHelpers.GetFileSizeAsync(media.Value, cancellationToken);

            var mediaDto = new MediaGetDto
            {
                PublicId = request.PublicId,
                Url = fileStorage.GetFileUrl(request.PublicId),
                MediaType = MediaHelpers.GetMediaType(request.PublicId),
                FileSize = fileSize
            };

            return Result<MediaGetDto>.Success(mediaDto);
        }
    }
}
