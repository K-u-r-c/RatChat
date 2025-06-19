namespace Domain.Enums;

public class ChatRoomRoles
{
    public const string Moderator = "Moderator";
    public const string Member = "Member";

    public static readonly Dictionary<string, (string Description, string Color)> Defaults
        = new()
        {
            [Moderator] = ("Moderator with moderation permissions", "#00ff00"), // Green color
            [Member] = ("Regular member with basic permissions", "#ffffff") // White color
        };

    public static readonly Dictionary<(string role, string permission), bool> DefaultsPermissions = new()
    {
        [(Moderator, ChatRoomPermissions.SendMessages)] = true,
        [(Moderator, ChatRoomPermissions.CreateInvitations)] = true,
        [(Moderator, ChatRoomPermissions.ManagePermissions)] = false,
        [(Moderator, ChatRoomPermissions.ManageRoles)] = false,

        [(Member, ChatRoomPermissions.SendMessages)] = true,
        [(Member, ChatRoomPermissions.CreateInvitations)] = false,
        [(Member, ChatRoomPermissions.ManagePermissions)] = false,
        [(Member, ChatRoomPermissions.ManageRoles)] = false        
    };
}
