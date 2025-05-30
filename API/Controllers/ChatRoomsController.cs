using Application.Chats.DTOs;
using Application.Chats.Queries;
using Application.Core;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ChatRoomsController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<PagedList<ChatRoomDto, DateTime?>>> GetChatRooms(
        [FromQuery] ChatRoomParams chatRoomParams
    )
    {
        return HandleResult(await Mediator.Send(
            new GetChatRoomList.Query { Params = chatRoomParams })
        );
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ChatRoomDto>> GetChatRoomDetails(string id)
    {
        return HandleResult(await Mediator.Send(new GetChatRoomDetails.Query { Id = id }));
    }
}
