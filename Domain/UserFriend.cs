namespace Domain;

public class UserFriend
{
    public required string UserId { get; set; }
    public User User { get; set; } = null!;
    public required string FriendId { get; set; }
    public User Friend { get; set; } = null!;
    public DateTime FriendsSince { get; set; } = DateTime.UtcNow;
}
