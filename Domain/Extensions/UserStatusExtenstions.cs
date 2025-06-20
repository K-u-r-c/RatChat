using Domain.Enums;

namespace Domain.Extensions;

public static class UserStatusExtensions
{
    /// <summary>
    /// Determines if a user status should be considered "online" for display purposes.
    /// Users with Online, Away, or DoNotDisturb statuses are considered online.
    /// </summary>
    /// <param name="status">The user status to check</param>
    /// <returns>True if the status represents an online state, false otherwise</returns>
    public static bool IsConsideredOnline(this UserStatus status)
    {
        return status is UserStatus.Online or UserStatus.Away or UserStatus.DoNotDisturb;
    }
}