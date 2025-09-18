using Application.DirectMessages.DTOs;
using Application.Interfaces;
using API.SignalR;
using Microsoft.AspNetCore.SignalR;

namespace API.Services;

public class DirectMessagesNotificationService(IHubContext<DirectMessageHub> hubContext)
    : IDirectMessagesNotificationService
{
    public async Task NotifyNewMessage(string directChatId, DirectMessageDto message)
    {
        await hubContext.Clients.Group(directChatId)
            .SendAsync("ReceiveDirectMessage", message);
    }
}

