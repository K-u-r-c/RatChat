using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

/// <summary>
/// SignalR hub broadcasting chat room membership moderation events.
/// <para>Events:</para>
/// <list type="bullet">
/// <item><description><c>UserKicked</c> – raised by
/// <see cref="API.Controllers.ChatRoomsController.KickChatRoomUser(string,string)"/>.</description></item>
/// <item><description><c>UserBanned</c> – raised by
/// <see cref="API.Controllers.ChatRoomsController.BanChatRoomUser(string,string)"/>.</description></item>
/// <item><description><c>UserUnbanned</c> – raised by
/// <see cref="API.Controllers.ChatRoomsController.UnbanChatRoomUser(string,string)"/>.</description></item>
/// </list>
/// </summary>
public class ChatRoomNotificationsHub : Hub
{
    public async override Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var chatRoomId = httpContext?.Request.Query["chatRoomId"];

        if (string.IsNullOrEmpty(chatRoomId))
            throw new HubException("No chat room with this id");

        await Groups.AddToGroupAsync(Context.ConnectionId, chatRoomId!);
        await base.OnConnectedAsync();
    }
}
