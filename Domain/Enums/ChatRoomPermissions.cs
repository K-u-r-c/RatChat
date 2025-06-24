namespace Domain.Enums;

public static class ChatRoomPermissions
{
    public const string SendMessages = "Send Messages";
    public const string CreateInvitations = "Create Invitations";

    // TODO: Implement more permissions

    /// <summary>
    /// Dictionary of all permissions and their descriptions.
    /// <para> 
    /// Key: Name of permission.
    /// Value: Description of the permission.
    /// </para>
    /// </summary>
    public static readonly Dictionary<string, string> All
        = new()
        {
            [SendMessages] = "Allows the user to send messages in the chat room.",
            [CreateInvitations] = "Allows the user to create invitations for the chat room.",
        };
}