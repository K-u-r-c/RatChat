namespace Domain.Enums;

public static class ChatRoomPermissions
{
    public const string SendMessages = "Send Messages";
    public const string CreateInviteLinks = "Create invite links";

    // TODO: Implement more permissions

    /// <summary>
    /// Dictionary of all permissions and their descriptions.
    /// <para> 
    /// Key: Name of permission. <br />
    /// Value: Description of the permission.
    /// </para>
    /// </summary>
    public static readonly Dictionary<string, string> All
        = new()
        {
            [SendMessages] = "Allows the user to send messages in the chat room.",
            [CreateInviteLinks] = "Allows the user to create invite links for the chat room.",
        };
}