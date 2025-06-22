using Domain.Enums;

namespace Application.Interfaces;

public interface IStatusNotificationService
{
    Task NotifyFriendsStatusChange(string userId, UserStatus status);
    Task NotifyUserOnline(string userId);
    Task NotifyUserOffline(string userId);
}