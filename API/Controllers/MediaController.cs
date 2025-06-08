using System.Reactive;
using Application.Media.Commands;
using Application.Media.DTOs;
using Application.Media.Queries;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class MediaController : BaseApiController
{
    [HttpPost("upload")]
    public async Task<ActionResult<MediaUploadResultDto>> UploadMedia(
        [FromForm] MediaUploadDto mediaUploadDto
    )
    {
        return HandleResult(await Mediator.Send(new UploadMedia.Command
        {
            MediaUploadDto = mediaUploadDto
        }));
    }

    [HttpGet("{publicId}")]
    public async Task<ActionResult<MediaGetDto>> GetMedia(
        string publicId,
        [FromQuery] string? folder)
    {
        return HandleResult(await Mediator.Send(new GetMedia.Query
        {
            PublicId = publicId,
            Folder = string.IsNullOrEmpty(folder) ? "" : folder
        }));
    }

    [HttpDelete("{publicId}")]
    public async Task<ActionResult<Unit>> DeleteMedia(
        string publicId,
        [FromQuery] MediaCategory category = MediaCategory.ProfileImage)
    {
        return HandleResult(await Mediator.Send(new DeleteMedia.Command
        {
            PublicId = publicId,
            Category = category
        }));
    }

    [HttpPost("set-main")]
    public async Task<ActionResult<Unit>> SetMainPhoto(
        [FromBody] SetMainPhotoDto setMainPhotoDto)
    {
        return HandleResult(await Mediator.Send(new SetMainPhoto.Command
        {
            MediaUrl = setMainPhotoDto.MediaUrl
        }));
    }
}
