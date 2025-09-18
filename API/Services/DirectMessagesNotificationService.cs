using System;
using Application.DirectMessages.DTOs;
using Application.Interfaces;
using API.SignalR;
using Domain;
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

        var recipientsToIncrement = participantIds
            .Where(id => id != message.SenderId)
            .ToList();

        if (recipientsToIncrement.Count > 0)
        {
            var existingCounters = await context.DirectChatNotifications
                .Where(n => n.DirectChatId == directChatId && recipientsToIncrement.Contains(n.UserId))
                .ToListAsync();

            foreach (var userId in recipientsToIncrement)
            {
                var counter = existingCounters.FirstOrDefault(n => n.UserId == userId);
                if (counter is null)
                {
                    counter = new DirectChatNotification
                    {
                        Id = Guid.NewGuid(),
                        DirectChatId = directChatId,
                        UserId = userId,
                    };
                    context.DirectChatNotifications.Add(counter);
                }

                counter.UnreadCount += 1;
                counter.UpdatedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync();
        }

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
