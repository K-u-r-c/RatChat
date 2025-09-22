using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

[Authorize]
public class EncryptedMessageHub(IUserAccessor userAccessor) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var user = await userAccessor.GetUserAsync();
        await Groups.AddToGroupAsync(Context.ConnectionId, $"encrypted-user-{user.Id}");
        await base.OnConnectedAsync();
    }
}
