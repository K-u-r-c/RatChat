using Application.Friends.DTOs;
using Application.Interfaces;
using Infrastructure.SignalR;
using Microsoft.AspNetCore.SignalR;

namespace Infrastructure.Services;

public class FriendsNotificationService(IHubContext<FriendsHub> hubContext) : IFriendsNotificationService
{
    public async Task NotifyFriendRequestSent(string receiverId, FriendRequestDto friendRequest)
    {
        await hubContext.Clients.Group($"user-{receiverId}")
            .SendAsync("FriendRequestReceived", friendRequest);
    }

    public async Task NotifyFriendRequestResponded(string senderId, string receiverId, bool accepted, FriendDto? newFriend = null)
    {
        if (accepted && newFriend != null)
        {
            await hubContext.Clients.Group($"user-{senderId}")
                .SendAsync("FriendRequestAccepted", receiverId, newFriend);

            await hubContext.Clients.Group($"user-{receiverId}")
                .SendAsync("FriendAdded", newFriend);
        }
        else
        {
            await hubContext.Clients.Group($"user-{senderId}")
                .SendAsync("FriendRequestDeclined", receiverId);
        }

        await hubContext.Clients.Groups($"user-{senderId}", $"user-{receiverId}")
            .SendAsync("FriendRequestRemoved", receiverId, senderId);
    }

    public async Task NotifyFriendRequestCancelled(string receiverId, string requestId)
    {
        await hubContext.Clients.Group($"user-{receiverId}")
            .SendAsync("FriendRequestCancelled", requestId);
    }

    public async Task NotifyFriendRemoved(string friendId, string removedByUserId)
    {
        await hubContext.Clients.Group($"user-{friendId}")
            .SendAsync("FriendRemoved", removedByUserId);
    }
}