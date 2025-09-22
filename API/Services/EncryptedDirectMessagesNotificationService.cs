using Application.EncryptedDirectMessages.DTOs;
using Application.Interfaces;
using API.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace API.Services;

public class EncryptedDirectMessagesNotificationService(
    IHubContext<EncryptedMessageHub> encryptedMessageHubContext,
    IHubContext<EncryptedDirectMessageHub> encryptedDirectMessageHubContext,
    AppDbContext context
) : IEncryptedDirectMessagesNotificationService
{
    public async Task NotifyNewMessage(string encryptedDirectChatId, EncryptedDirectMessageDto message, bool broadcastToEncryptedChat = false)
    {
        var chatParticipants = await context.EncryptedDirectChats
            .Where(dc => dc.Id == encryptedDirectChatId)
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
            var existingCounters = await context.EncryptedDirectChatNotifications
                .Where(n => n.EncryptedDirectChatId == encryptedDirectChatId && recipientsToIncrement.Contains(n.UserId))
                .ToListAsync();

            foreach (var userId in recipientsToIncrement)
            {
                var counter = existingCounters.FirstOrDefault(n => n.UserId == userId);
                if (counter is null)
                {
                    counter = new Domain.EncryptedDirectChatNotification
                    {
                        Id = Guid.NewGuid(),
                        EncryptedDirectChatId = encryptedDirectChatId,
                        UserId = userId,
                    };
                    context.EncryptedDirectChatNotifications.Add(counter);
                }

                counter.UnreadCount += 1;
                counter.UpdatedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync();
        }

        if (broadcastToEncryptedChat)
        {
            await encryptedDirectMessageHubContext.Clients.Group(encryptedDirectChatId)
                .SendAsync("ReceiveEncryptedDirectMessage", message);
        }

        var payload = new
        {
            encryptedDirectChatId,
            message,
        };

        foreach (var userId in participantIds)
        {
            await encryptedMessageHubContext.Clients.Group($"encrypted-user-{userId}")
                .SendAsync("EncryptedDirectChatUpdated", payload);
        }
    }
}
