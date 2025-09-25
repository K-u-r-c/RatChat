using Application.ChatAppearances.DTOs;
using Application.Interfaces;
using System.Linq;
using API.SignalR;
using Microsoft.AspNetCore.SignalR;

namespace API.Services;

public class ChatAppearanceNotificationService(
    IHubContext<MessageHub> messageHubContext,
    IHubContext<DirectMessageHub> directMessageHubContext,
    IHubContext<EncryptedDirectMessageHub> encryptedDirectMessageHubContext
) : IChatAppearanceNotificationService
{
    public async Task NotifyAppearanceChanged(
        string chatType,
        string chatId,
        ChatAppearanceDto appearance,
        IReadOnlyCollection<string> participantUserIds)
    {
        var payload = new
        {
            chatType,
            chatId,
            appearance.DefaultEmoji,
            appearance.BackgroundKey,
            appearance.BackgroundCustomUrl,
            appearance.BackgroundCustomPublicId,
            appearance.UpdatedByUserId,
            appearance.UpdatedAt,
        };

        foreach (var userId in participantUserIds.Where(id => !string.IsNullOrWhiteSpace(id)))
        {
            await messageHubContext.Clients.Group($"user-{userId}")
                .SendAsync("ChatAppearanceUpdated", payload);
        }

        switch (chatType)
        {
            case "ChatRoom":
                await messageHubContext.Clients.Group($"chatroom-{chatId}")
                    .SendAsync("ChatAppearanceUpdated", payload);
                break;
            case "DirectChat":
                await directMessageHubContext.Clients.Group(chatId)
                    .SendAsync("ChatAppearanceUpdated", payload);
                break;
            case "EncryptedDirectChat":
                await encryptedDirectMessageHubContext.Clients.Group(chatId)
                    .SendAsync("ChatAppearanceUpdated", payload);
                break;
        }
    }
}
