using Application.Media.Commands;
using Application.Media.DTOs;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class MediaController : BaseApiController
{
    [HttpPost("upload")]
    public async Task<ActionResult<MediaUploadResultDto>> UploadMedia(
        [FromForm] MediaUploadDto mediaUploadDto)
    {
        return HandleResult(await Mediator.Send(new UploadMedia.Command
        {
            MediaUploadDto = mediaUploadDto
        }));
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