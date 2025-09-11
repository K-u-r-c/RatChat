using Application.ChatRooms.Events;
using MediatR;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR.EventHandlers;

public class ChatRoomsProfileUpdateHandler(IHubContext<ChatRoomsProfileUpdateHub> hubContext)
    : INotificationHandler<ChatRoomProfileImageUpdatedNotification>
{
    public async Task Handle(ChatRoomProfileImageUpdatedNotification notification, CancellationToken cancellationToken)
    {
        await hubContext.Clients.All.SendAsync("ChatRoomImageUpdated", cancellationToken);
    }
}
