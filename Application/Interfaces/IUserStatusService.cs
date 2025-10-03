using Domain.Enums;

namespace Application.Interfaces;

public interface IUserStatusService
{
    Task SetUserOnlineAsync(string userId, string connectionId);
    Task SetUserOfflineAsync(string userId, string connectionId);
    Task<List<string>> GetOnlineUsersAsync(List<string> userIds);
    Task<Dictionary<string, (UserStatus Status, bool IsOnline, DateTime LastSeen)>> GetActualStatusesAsync(
        IEnumerable<string> userIds);
    Task<bool> IsUserOnlineAsync(string userId);
    Task<UserStatus> GetActualUserStatusAsync(string userId);
}