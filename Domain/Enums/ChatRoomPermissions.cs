namespace Domain.Enums;

public static class ChatRoomPermissions
{
    public const string SendMessages = "Send Messages";
    public const string CreateInvitations = "Create Invitations";
    public const string ManageRoles = "Manage Roles";
    public const string ManagePermissions = "Manage Permissions";

    public static readonly Dictionary<string, string> All
        = new()
        {
            [SendMessages] = "Allows the user to send messages in the chat room.",
            [CreateInvitations] = "Allows the user to create invitations for the chat room.",
            [ManageRoles] = "Allows the user to manage roles within the chat room.",
            [ManagePermissions] = "Allows the user to manage permissions for roles in the chat room."
        };
}