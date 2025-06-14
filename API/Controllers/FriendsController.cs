using Application.Core;
using Application.Friends.Commands;
using Application.Friends.DTOs;
using Application.Friends.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class FriendsController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<FriendDto>>> GetFriends()
    {
        return HandleResult(await Mediator.Send(new GetFriends.Query()));
    }

    [HttpGet("requests")]
    public async Task<ActionResult<GetFriendRequests.FriendRequestsResponse>> GetFriendRequests()
    {
        return HandleResult(await Mediator.Send(new GetFriendRequests.Query()));
    }

    [HttpGet("search/{friendCode}")]
    public async Task<ActionResult<FriendSearchDto>> SearchUserByFriendCode(string friendCode)
    {
        return HandleResult(
            await Mediator.Send(
                new SearchUserByFriendCode.Query
                {
                    FriendCode = friendCode
                }
            )
        );
    }

    [HttpPost("request")]
    public async Task<ActionResult<Unit>> SendFriendRequest(SendFriendRequestDto sendFriendRequestDto)
    {
        return HandleResult(await Mediator.Send(
            new SendFriendRequest.Command { SendFriendRequestDto = sendFriendRequestDto }));
    }

    [HttpPost("request/respond")]
    public async Task<ActionResult<Unit>> RespondToFriendRequest(RespondToFriendRequestDto respondDto)
    {
        return HandleResult(await Mediator.Send(
            new RespondToFriendRequest.Command { RespondToFriendRequestDto = respondDto }));
    }

    [HttpDelete("request/{requestId}")]
    public async Task<ActionResult<Unit>> CancelFriendRequest(string requestId)
    {
        return HandleResult(await Mediator.Send(
            new CancelFriendRequest.Command { RequestId = requestId }));
    }

    [HttpDelete("{friendId}")]
    public async Task<ActionResult<Unit>> RemoveFriend(string friendId)
    {
        return HandleResult(await Mediator.Send(
            new RemoveFriend.Command { FriendId = friendId }));
    }
}