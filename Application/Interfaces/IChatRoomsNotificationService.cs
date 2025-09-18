using Application.Messages.DTOs;

namespace Application.Interfaces;

public interface IChatRoomsNotificationService
{
    Task NotifyChatRoomUpdated(string chatRoomId, MessageDto message);
}

