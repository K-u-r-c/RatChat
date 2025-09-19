using Application.Notifications.Commands;
using Application.Notifications.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class NotificationsController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetCounters()
    {
        return HandleResult(await Mediator.Send(new GetNotificationCounters.Query()));
    }

    [HttpPost("chat-rooms/{chatRoomId}/read")]
    public async Task<IActionResult> MarkChatRoomRead(string chatRoomId)
    {
        return HandleResult(await Mediator.Send(new MarkChatRoomNotificationsRead.Command
        {
            ChatRoomId = chatRoomId,
        }));
    }

    [HttpPost("direct-chats/{directChatId}/read")]
    public async Task<IActionResult> MarkDirectChatRead(string directChatId)
    {
        return HandleResult(await Mediator.Send(new MarkDirectChatNotificationsRead.Command
        {
            DirectChatId = directChatId,
        }));
    }
}
