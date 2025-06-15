namespace Domain.Enums;

public static class ChatRoomPermissions
{
    public const string SendMessages = "SEND_MESSAGES";

    public static readonly Dictionary<string, (string Name, string Description)> Definitions
        = new()
    {
        [SendMessages] = ("Send Messages", "Allows the user to send messages in the chat room.")
    };
}