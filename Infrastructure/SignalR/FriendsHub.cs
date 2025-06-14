using Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Infrastructure.SignalR;

public class FriendsHub(IUserAccessor userAccessor) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var user = await userAccessor.GetUserAsync();
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{user.Id}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var user = await userAccessor.GetUserAsync();
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{user.Id}");
        await base.OnDisconnectedAsync(exception);
    }
}