using Application.Chats.DTOs;
using Application.Chats.Queries;
using Application.Core;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ChatRoomController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<PagedList<ChatRoomDto, DateTime?>>> GetActivities(
        [FromQuery] ChatRoomParams chatRoomParams
    )
    {
        return HandleResult(await Mediator.Send(new GetChatRoomList.Query { Params = chatRoomParams }));
    }
}
