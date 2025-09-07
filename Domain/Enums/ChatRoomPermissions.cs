namespace Domain.Enums;

public static class ChatRoomPermissions
{
    public const string ViewChatRoom = "View chat room";
    public const string SendMessages = "Send Messages";
    public const string CreateInviteLinks = "Create invite links";
    public const string ChangeChatRoomImage = "Change chat room image";
    public const string KickFromChatRoom = "Kick from chatroom";
    public const string BanFromChatRoom = "Ban from chatroom";
    public const string UnbanFromChatRoom = "Unban from chatroom";


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
            [ViewChatRoom] = "Allows the user to view and access the chat room.",
            [SendMessages] = "Allows the user to send messages in the chat room.",
            [CreateInviteLinks] = "Allows the user to create invite links for the chat room.",
            [ChangeChatRoomImage] = "Allows the user to change the chat room’s icon/image."
            [KickFromChatRoom] = "Allows the user to kick others from the chat room",
            [BanFromChatRoom] = "Allows the user to ban others from the chat room",
            [UnbanFromChatRoom] = "Allows the user to unban banned user from the chat room",
        };
}
