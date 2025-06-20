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
        var groupName = $"user-{user.Id}";

        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await userStatusService.SetUserOnlineAsync(user.Id, Context.ConnectionId);

        Console.WriteLine($"User {user.Id} connected to status hub with connection {Context.ConnectionId}");
        Console.WriteLine($"Added to group: {groupName}");

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var user = await userAccessor.GetUserAsync();
        var groupName = $"user-{user.Id}";

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        await userStatusService.SetUserOfflineAsync(user.Id, Context.ConnectionId);

        Console.WriteLine($"User {user.Id} disconnected from status hub with connection {Context.ConnectionId}");

        await base.OnDisconnectedAsync(exception);
    }

    public async Task UpdateStatus(UpdateStatusDto updateStatusDto)
    {
        var user = await userAccessor.GetUserAsync();
        Console.WriteLine($"User {user.Id} updating status to {updateStatusDto.Status} via SignalR");

        await mediator.Send(new UpdateStatus.Command { UpdateStatusDto = updateStatusDto });
    }
}