using Application.EncryptedDirectChats.Queries;
using Application.EncryptedDirectMessages.Commands;
using Application.EncryptedDirectMessages.Queries;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class EncryptedDirectChatsController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult> GetEncryptedDirectChats()
    {
        return HandleResult(await Mediator.Send(new GetEncryptedDirectChats.Query()));
    }

    [HttpGet("{encryptedDirectChatId}/messages")]
    public async Task<ActionResult> GetEncryptedDirectMessages(
        string encryptedDirectChatId,
        [FromQuery] DateTime? cursor = null,
        [FromQuery] int pageSize = 20)
    {
        return HandleResult(await Mediator.Send(new GetEncryptedDirectMessages.Query
        {
            EncryptedDirectChatId = encryptedDirectChatId,
            Cursor = cursor,
            PageSize = pageSize
        }));
    }

    [HttpPost("{encryptedDirectChatId}/messages")]
    public async Task<ActionResult> SendEncryptedDirectMessage(
        string encryptedDirectChatId,
        [FromBody] SendEncryptedDirectMessage.Command command)
    {
        command.EncryptedDirectChatId = encryptedDirectChatId;
        return HandleResult(await Mediator.Send(command));
    }
}
