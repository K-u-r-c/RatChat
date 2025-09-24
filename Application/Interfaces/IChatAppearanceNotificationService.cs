using Application.ChatAppearances.DTOs;

namespace Application.Interfaces;

public interface IChatAppearanceNotificationService
{
    Task NotifyAppearanceChanged(
        string chatType,
        string chatId,
        ChatAppearanceDto appearance,
        IReadOnlyCollection<string> participantUserIds);
}
