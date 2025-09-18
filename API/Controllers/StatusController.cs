using Application.Status.Commands;
using Application.Status.DTOs;
using Application.Status.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class StatusController : BaseApiController
{
    [HttpPost("update")]
    public async Task<ActionResult<Unit>> UpdateStatus(UpdateStatusDto updateStatusDto)
    {
        return HandleResult(await Mediator.Send(new UpdateStatus.Command
        {
            UpdateStatusDto = updateStatusDto
        }));
    }

    [HttpGet("users")]
    public async Task<ActionResult<OnlineUsersDto>> GetOnlineUsers([FromQuery] string[] userIds)
    {
        return HandleResult(await Mediator.Send(new GetOnlineUsers.Query
        {
            UserIds = [.. userIds]
        }));
    }

    [HttpGet("{userId}")]
    public async Task<ActionResult<UserStatusDto>> GetUserStatus(string userId)
    {
        return HandleResult(await Mediator.Send(new GetUserStatus.Query
        {
            UserId = userId
        }));
    }
}