namespace Domain;

public class ChatRoomRolePermission
{
    public required string RoleId { get; set; }
    public ChatRoomRole Role { get; set; } = null!;
    public required string PermissionId { get; set; }
    public ChatRoomPermission Permission { get; set; } = null!;
    public bool IsAllowed { get; set; } = false;
}
