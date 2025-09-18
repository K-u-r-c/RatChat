using Application.DirectMessages.DTOs;
using Application.Interfaces;
using API.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace API.Services;

public class DirectMessagesNotificationService(
    IHubContext<MessageHub> hubContext,
    AppDbContext context
) : IDirectMessagesNotificationService
{
    public async Task NotifyNewMessage(string directChatId, DirectMessageDto message)
    {
        var chatParticipants = await context.DirectChats
            .Where(dc => dc.Id == directChatId)
            .Select(dc => new { dc.User1Id, dc.User2Id })
            .FirstOrDefaultAsync();

        if (chatParticipants is null) return;

        var participantIds = new[] { chatParticipants.User1Id, chatParticipants.User2Id }
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToList();

        if (participantIds.Count == 0) return;

        var payload = new
        {
            directChatId,
            message,
        };

        foreach (var userId in participantIds)
        {
            await hubContext.Clients.Group($"user-{userId}")
                .SendAsync("DirectChatUpdated", payload);
        }
    }
}
