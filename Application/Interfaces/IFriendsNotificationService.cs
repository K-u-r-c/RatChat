using Application.Friends.DTOs;

namespace Application.Interfaces;

public interface IFriendsNotificationService
{
    Task NotifyFriendRequestSent(string receiverId, FriendRequestDto friendRequest);
    Task NotifyFriendRequestResponded(string senderId, string receiverId, bool accepted, FriendDto? newFriend = null);
    Task NotifyFriendRequestCancelled(string receiverId, string requestId);
    Task NotifyFriendRemoved(string friendId, string removedByUserId);
}