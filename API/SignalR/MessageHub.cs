using Application.Core;
using Application.Messages.Commands;
using Application.Messages.Queries;
using Application.Messages.SignalR;
using MediatR;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

public class MessageHub(IMediator mediator) : Hub
{
    public async Task SendMessage(AddMessage.Command command)
    {
        try
        {
            var message = await HandleSendMessage.TrySendMessageAsync(mediator, command);

            await Clients.Group(command.ChatRoomId).SendAsync("ReceiveMessage", message.Value);
        }
        catch (SendMessageHubException hubException)
        {
            if (hubException.ErrorCode == ErrorCodes.WillNotBeProcessed) return;

            await Clients.Caller.SendAsync("ReceiveError", hubException.ErrorCode, hubException.Message);
        }
    }

    public async Task SendMediaMessage(AddMessage.Command command)
    {
        try
        {
            if (command.Type != "Text" && string.IsNullOrEmpty(command.MediaUrl))
            {
                await Clients.Caller.SendAsync("ReceiveError", 400, "Media URL is required for media messages");
                return;
            }

            var message = await HandleSendMessage.TrySendMessageAsync(mediator, command);

            await Clients.Group(command.ChatRoomId).SendAsync("ReceiveMessage", message.Value);
        }
        catch (SendMessageHubException hubException)
        {
            if (hubException.ErrorCode == ErrorCodes.WillNotBeProcessed) return;

            await Clients.Caller.SendAsync("ReceiveError", hubException.ErrorCode, hubException.Message);
        }
    }

    public async Task LoadMoreMessages(string chatRoomId, DateTime? cursor, int pageSize = 20)
    {
        try
        {
            var result = await mediator.Send(
                new GetMessages.Query
                {
                    ChatRoomId = chatRoomId,
                    Cursor = cursor,
                    PageSize = pageSize
                }
            );

            await Clients.Caller.SendAsync("ReceiveOlderMessages", result.Value);
        }
        catch
        {
            await Clients.Caller.SendAsync("ReceiveError", 500, "Failed to load more messages");
        }
    }

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var chatRoomId = httpContext?.Request.Query["chatRoomId"];

        if (string.IsNullOrEmpty(chatRoomId)) throw new HubException("No chat room with this id");

        await Groups.AddToGroupAsync(Context.ConnectionId, chatRoomId!);

        var initialPageSize =
            int.TryParse(httpContext?.Request.Query["initialPageSize"], out var size) ? size : 20;

        var result = await mediator.Send(
            new GetMessages.Query
            {
                ChatRoomId = chatRoomId!,
                PageSize = initialPageSize
            }
        );

        await Clients.Caller.SendAsync("LoadMessages", result.Value);
    }
}