namespace Domain.Enums;

public static class ChatRoomRoles
{
    public const string Moderator = "Moderator";
    public const string Member = "Member";

    public static readonly Dictionary<string, (string Description, string Color)> Defaults = new()
    {
        [Moderator] = ("Moderator with moderation permissions", "#00ff00"), // Green
        [Member] = ("Regular member with basic permissions", "#333333"), // Dark grey
    };

    public static readonly Dictionary<(string role, string permission), bool> DefaultsPermissions = new()
    {
        [(Moderator, ChatRoomPermissions.ViewChatRoom)] = true,
        [(Moderator, ChatRoomPermissions.SendMessages)] = true,
        [(Moderator, ChatRoomPermissions.CreateInviteLinks)] = true,
        [(Moderator, ChatRoomPermissions.KickFromChatRoom)] = true,
        [(Moderator, ChatRoomPermissions.BanFromChatRoom)] = true,
        [(Moderator, ChatRoomPermissions.UnbanFromChatRoom)] = true,
        [(Moderator, ChatRoomPermissions.ManageChatRoomRoles)] = true,

        [(Member, ChatRoomPermissions.ViewChatRoom)] = true,
        [(Member, ChatRoomPermissions.SendMessages)] = true,
    };
}
