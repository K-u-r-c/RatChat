using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

public class ChatRoomsProfileUpdateHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var chatRoomId = Context.GetHttpContext()?.Request.Query["chatRoomId"].ToString();
        if (!string.IsNullOrWhiteSpace(chatRoomId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, chatRoomId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var chatRoomId = Context.GetHttpContext()?.Request.Query["chatRoomId"].ToString();
        if (!string.IsNullOrWhiteSpace(chatRoomId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatRoomId);
        }
        await base.OnDisconnectedAsync(exception);
    }
}