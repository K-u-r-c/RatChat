using Application.Profiles.Commands;
using Application.Profiles.DTOs;
using Application.Profiles.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ProfilesController : BaseApiController
{
    [HttpGet("{identifier}")]
    public async Task<ActionResult<UserProfileDto>> GetProfile(string identifier)
    {
        return HandleResult(await Mediator.Send(new GetProfile.Query { Identifier = identifier }));
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