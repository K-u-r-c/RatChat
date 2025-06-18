using Application.Core;
using Application.DirectMessages.Commands;
using Application.DirectMessages.Queries;
using Application.Messages.SignalR;
using MediatR;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

public class DirectMessageHub(IMediator mediator) : Hub
{
    public async Task SendDirectMessage(SendDirectMessage.Command command)
    {
        try
        {
            var message = await mediator.Send(command);

            if (!message.IsSuccess || message.Value == null)
                throw new SendMessageHubException(message.Error ?? "Failed to send message", message.Code);

            await Clients.Group(command.DirectChatId).SendAsync("ReceiveDirectMessage", message.Value);
        }
        catch (SendMessageHubException hubException)
        {
            if (hubException.ErrorCode == ErrorCodes.WillNotBeProcessed) return;

            await Clients.Caller.SendAsync("ReceiveError", hubException.ErrorCode, hubException.Message);
        }
    }

    public async Task SendDirectMediaMessage(SendDirectMessage.Command command)
    {
        try
        {
            if (command.Type != "Text" && string.IsNullOrEmpty(command.MediaUrl))
            {
                await Clients.Caller.SendAsync("ReceiveError", 400, "Media URL is required for media messages");
                return;
            }

            var message = await mediator.Send(command);

            if (!message.IsSuccess || message.Value == null)
                throw new SendMessageHubException(message.Error ?? "Failed to send message", message.Code);

            await Clients.Group(command.DirectChatId).SendAsync("ReceiveDirectMessage", message.Value);
        }
        catch (SendMessageHubException hubException)
        {
            if (hubException.ErrorCode == ErrorCodes.WillNotBeProcessed) return;

            await Clients.Caller.SendAsync("ReceiveError", hubException.ErrorCode, hubException.Message);
        }
    }

    public async Task LoadMoreDirectMessages(string directChatId, DateTime? cursor, int pageSize = 20)
    {
        try
        {
            var result = await mediator.Send(
                new GetDirectMessages.Query
                {
                    DirectChatId = directChatId,
                    Cursor = cursor,
                    PageSize = pageSize
                }
            );

            await Clients.Caller.SendAsync("ReceiveOlderDirectMessages", result.Value);
        }
        catch
        {
            await Clients.Caller.SendAsync("ReceiveError", 500, "Failed to load more messages");
        }
    }

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var directChatId = httpContext?.Request.Query["directChatId"];

        if (string.IsNullOrEmpty(directChatId)) throw new HubException("No direct chat with this id");

        await Groups.AddToGroupAsync(Context.ConnectionId, directChatId!);

        var initialPageSize =
            int.TryParse(httpContext?.Request.Query["initialPageSize"], out var size) ? size : 20;

        var result = await mediator.Send(
            new GetDirectMessages.Query
            {
                DirectChatId = directChatId!,
                PageSize = initialPageSize
            }
        );

        await Clients.Caller.SendAsync("LoadDirectMessages", result.Value);
    }
}