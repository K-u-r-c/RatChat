using Application.Core;
using Application.Interfaces;
using Application.Media.Commands;
using Application.Media.DTOs;
using Application.Media.Helpers;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace API.Controllers;

public class MediaController(
    IFileStorage fileStorage,
    AppDbContext context,
    IUserAccessor userAccessor
) : BaseApiController
{
    [HttpPost("upload")]
    public async Task<ActionResult<MediaUploadResultDto>> UploadMedia(
        [FromForm] MediaUploadDto mediaUploadDto)
    {
        var result = await Mediator.Send(new UploadMedia.Command
        {
            MediaUploadDto = mediaUploadDto
        });

        if (result != null && result.IsSuccess && result.Value != null)
        {
            var scheme = Request.Scheme;
            var host = Request.Host.Value;

            result.Value.Url = $"{scheme}://{host}/api/media/{result.Value.PublicId}";
        }

        if (result == null)
            return HandleResult(Result<MediaUploadResultDto>.Failure("Unknown error", 500));

        return HandleResult(result);
    }

    [HttpGet("{publicId}")]
    public async Task<IActionResult> GetMedia(
        string publicId,
        [FromQuery] MediaCategory category = MediaCategory.ProfileImage,
        [FromQuery] string? chatRoomId = null,
        [FromQuery] string? channelId = null)
    {
        var mediaFile = await context.MediaFiles.FirstOrDefaultAsync(m => m.PublicId == publicId);
        if (mediaFile == null) return NotFound();

        if (MediaHelpers.IsChatRoomMedia(Enum.Parse<MediaCategory>(mediaFile.Category)))
        {
            var user = await userAccessor.GetUserAsync();
            if (user == null) return Unauthorized();

            if (!string.IsNullOrEmpty(mediaFile.ChatRoomId))
            {
                var hasAccess = await context.ChatRoomMembers
                    .AnyAsync(m => m.ChatRoomId == mediaFile.ChatRoomId && m.UserId == user.Id);

                if (!hasAccess) return Forbid();
            }
            else
            {
                if (mediaFile.UploadedById != user.Id)
                {
                    var hasAccessDirect = await context.DirectMessages
                        .AnyAsync(dm => dm.MediaPublicId == mediaFile.PublicId &&
                                        (dm.DirectChat.User1Id == user.Id || dm.DirectChat.User2Id == user.Id));

                    var hasAccessEncrypted = await context.EncryptedDirectMessages
                        .AnyAsync(
                            dm =>
                            dm.EncryptedDirectChat.User1Id == user.Id
                            ||
                            dm.EncryptedDirectChat.User2Id == user.Id
                        );

                    if (!hasAccessDirect && !hasAccessEncrypted) return Forbid();
                }
            }
        }

        var mediaCategory = Enum.Parse<MediaCategory>(mediaFile.Category);
        var folderPath = MediaHelpers.GetFolderPath(mediaCategory, mediaFile.UploadedById, mediaFile.ChatRoomId, mediaFile.ChannelId);

        var streamResult = await fileStorage.GetFileAsync(mediaFile.PublicId, folderPath);
        if (!streamResult.IsSuccess || streamResult.Value == null)
            return HandleResult(
                Result<Stream>
                    .Failure(streamResult.Error ?? "Failed to retrieve file", streamResult.Code)
            );

        var stream = streamResult.Value!;
        var fsr = new FileStreamResult(stream, mediaFile.MediaType ?? "application/octet-stream")
        {
            EnableRangeProcessing = true
        };

        return fsr;
    }

    [HttpDelete("{publicId}")]
    public async Task<ActionResult<Unit>> DeleteMedia(
        string publicId,
        [FromQuery] MediaCategory category = MediaCategory.ProfileImage,
        [FromQuery] string? chatRoomId = null,
        [FromQuery] string? channelId = null)
    {
        return HandleResult(await Mediator.Send(new DeleteMedia.Command
        {
            PublicId = publicId,
            Category = category,
            ChatRoomId = chatRoomId,
            ChannelId = channelId
        }));
    }
}