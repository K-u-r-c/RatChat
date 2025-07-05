namespace Domain.Enums;

public class ChatRoomRoles
{
    public const string Moderator = "Moderator";
    public const string Member = "Member";

    public static readonly Dictionary<string, (string Description, string Color)> Defaults
        = new()
        {
            [Moderator] = ("Moderator with moderation permissions", "#00ff00"), // Green color
            [Member] = ("Regular member with basic permissions", "#333333") // Grey color
        };
    
    public static readonly Dictionary<(string role, string permission), bool> DefaultsPermissions = new()
    {
        [(Moderator, ChatRoomPermissions.SendMessages)] = true,
        [(Moderator, ChatRoomPermissions.CreateInviteLinks)] = true,

        [(Member, ChatRoomPermissions.SendMessages)] = true,
        [(Member, ChatRoomPermissions.CreateInviteLinks)] = false,
    };
}
