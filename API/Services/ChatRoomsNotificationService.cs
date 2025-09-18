using Application.Interfaces;
using Application.Messages.DTOs;
using API.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace API.Services;

public class ChatRoomsNotificationService(
    IHubContext<MessageHub> hubContext,
    AppDbContext context
) : IChatRoomsNotificationService
{
    public async Task NotifyChatRoomUpdated(string chatRoomId, MessageDto message)
    {
        var recipientIds = await context.ChatRoomMembers
            .Where(m => m.ChatRoomId == chatRoomId)
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync();

        var payload = new
        {
            chatRoomId,
            message
        };

        foreach (var userId in recipientIds)
        {
            await hubContext.Clients.Group($"user-{userId}")
                .SendAsync("ChatRoomUpdated", payload);
        }
    }
}

