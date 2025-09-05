using System.ComponentModel.DataAnnotations;

namespace Domain;

public class ChatRoomInvite
{
    [Key]
    public required string Id { get; set; }

    public required string ChatRoomId { get; set; }
    public ChatRoom ChatRoom { get; set; } = null!;

    public required string CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    // Random secret paired with Id to validate token
    [MaxLength(200)]
    public required string Secret { get; set; }

    // If set, only this user can redeem the invite
    public string? AllowedUserId { get; set; }
    public User? AllowedUser { get; set; }

    // Max number of uses (null => unlimited)
    public int? MaxUses { get; set; }
    public int Uses { get; set; } = 0;

    public DateTime? ExpiresAt { get; set; }

    public bool Revoked { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

