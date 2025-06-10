using Application.Profiles.Commands;
using Application.Profiles.DTOs;
using Application.Profiles.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ProfilesController : BaseApiController
{
    [HttpGet("{id}")]
    public async Task<ActionResult<UserProfileDto>> GetProfile(string id)
    {
        return HandleResult(await Mediator.Send(new GetProfile.Query { Id = id }));
    }

    [HttpPut]
    public async Task<ActionResult<Unit>> UpdateProfile(UpdateProfileDto updateProfileDto)
    {
        return HandleResult(await Mediator.Send(
            new UpdateProfile.Command { UpdateProfileDto = updateProfileDto }
        ));
    }

    [HttpPost("set-profile-image")]
    public async Task<ActionResult<Unit>> SetMainPhoto(SetProfileImageDto setProfileImageDto)
    {
        return HandleResult(await Mediator.Send(
            new SetProfileImage.Command { SetProfileImageDto = setProfileImageDto }
        ));
    }
}