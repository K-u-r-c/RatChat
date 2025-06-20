using Domain.Enums;

namespace Application.Interfaces;

public interface IUserStatusService
{
    Task SetUserOnlineAsync(string userId, string connectionId);
    Task SetUserOfflineAsync(string userId, string connectionId);
    Task<List<string>> GetOnlineUsersAsync(List<string> userIds);
    Task<UserStatus> GetActualUserStatusAsync(string userId);
    Task<bool> IsUserOnlineAsync(string userId);
}