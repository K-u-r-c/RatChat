using Application.DirectMessages.DTOs;

namespace Application.Interfaces;

public interface IDirectMessagesNotificationService
{
    Task NotifyNewMessage(string directChatId, DirectMessageDto message);
}

