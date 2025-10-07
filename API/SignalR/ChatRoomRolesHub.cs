using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

public class ChatRoomRolesHub() : Hub
{
    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var chatRoomId = httpContext?.Request.Query["chatRoomId"];

        if (string.IsNullOrEmpty(chatRoomId)) throw new HubException("No chat room with this id");

        await Groups.AddToGroupAsync(Context.ConnectionId, chatRoomId!);

        await base.OnConnectedAsync();
    }
}
