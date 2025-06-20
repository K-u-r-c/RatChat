using Application.Interfaces;
using Application.Status.Commands;
using Application.Status.DTOs;
using MediatR;
using Microsoft.AspNetCore.SignalR;

namespace Infrastructure.SignalR;

public class StatusHub(IUserAccessor userAccessor, IUserStatusService userStatusService, IMediator mediator)
    : Hub
{
    public override async Task OnConnectedAsync()
    {
        var user = await userAccessor.GetUserAsync();
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{user.Id}");
        await userStatusService.SetUserOnlineAsync(user.Id, Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var user = await userAccessor.GetUserAsync();
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{user.Id}");
        await userStatusService.SetUserOfflineAsync(user.Id, Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task UpdateStatus(UpdateStatusDto updateStatusDto)
    {
        await mediator.Send(new UpdateStatus.Command { UpdateStatusDto = updateStatusDto });
    }
}