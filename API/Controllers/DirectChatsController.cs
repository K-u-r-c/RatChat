using Application.DirectChats.Commands;
using Application.DirectChats.Queries;
using Application.DirectMessages.Commands;
using Application.DirectMessages.Queries;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class DirectChatsController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult> GetDirectChats()
    {
        return HandleResult(await Mediator.Send(new GetDirectChats.Query()));
    }

    [HttpPost]
    public async Task<ActionResult> CreateDirectChat([FromBody] CreateDirectChat.Command command)
    {
        return HandleResult(await Mediator.Send(command));
    }

    [HttpGet("{directChatId}/messages")]
    public async Task<ActionResult> GetDirectMessages(
        string directChatId,
        [FromQuery] DateTime? cursor = null,
        [FromQuery] int pageSize = 20)
    {
        return HandleResult(await Mediator.Send(new GetDirectMessages.Query
        {
            DirectChatId = directChatId,
            Cursor = cursor,
            PageSize = pageSize
        }));
    }

    [HttpPost("{directChatId}/messages")]
    public async Task<ActionResult> SendDirectMessage(
        string directChatId,
        [FromBody] SendDirectMessage.Command command)
    {
        command.DirectChatId = directChatId;
        return HandleResult(await Mediator.Send(command));
    }
}