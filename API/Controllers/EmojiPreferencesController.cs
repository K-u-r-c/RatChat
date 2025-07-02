using Application.EmojiPreferences.Commands;
using Application.EmojiPreferences.DTOs;
using Application.EmojiPreferences.Queries;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class EmojiPreferencesController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<EmojiPreferenceDto>> GetEmojiPreference(
        [FromQuery] string chatType,
        [FromQuery] string chatId)
    {
        return HandleResult(await Mediator.Send(new GetEmojiPreference.Query
        {
            ChatType = chatType,
            ChatId = chatId
        }));
    }

    [HttpPost]
    public async Task<ActionResult<EmojiPreferenceDto>> SetEmojiPreference(
        SetEmojiPreferenceDto setEmojiPreferenceDto)
    {
        return HandleResult(await Mediator.Send(new SetEmojiPreference.Command
        {
            SetEmojiPreferenceDto = setEmojiPreferenceDto
        }));
    }
}