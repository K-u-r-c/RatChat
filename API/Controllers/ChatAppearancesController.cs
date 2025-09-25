using Application.ChatAppearances.Commands;
using Application.ChatAppearances.DTOs;
using Application.ChatAppearances.Queries;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ChatAppearancesController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<ChatAppearanceDto>> GetChatAppearance(
        [FromQuery] string chatType,
        [FromQuery] string chatId)
    {
        return HandleResult(await Mediator.Send(new GetChatAppearance.Query
        {
            ChatType = chatType,
            ChatId = chatId
        }));
    }

    [HttpPost]
    public async Task<ActionResult<ChatAppearanceDto>> SetChatAppearance(
        SetChatAppearanceDto setChatAppearanceDto)
    {
        return HandleResult(await Mediator.Send(new SetChatAppearance.Command
        {
            SetChatAppearanceDto = setChatAppearanceDto
        }));
    }
}
