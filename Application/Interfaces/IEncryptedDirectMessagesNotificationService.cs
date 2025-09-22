using Application.EncryptedDirectMessages.DTOs;

namespace Application.Interfaces;

public interface IEncryptedDirectMessagesNotificationService
{
    Task NotifyNewMessage(string encryptedDirectChatId, EncryptedDirectMessageDto message, bool broadcastToEncryptedChat = false);
}
