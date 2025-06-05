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
            if (hubException.ErrorCode == 422) return;

            await Clients.Caller.SendAsync("ReceiveError", hubException.ErrorCode, hubException.Message);
        }
    }

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var chatRoomId = httpContext?.Request.Query["chatRoomId"];

        if (string.IsNullOrEmpty(chatRoomId)) throw new HubException("No chat room with this id");

        await Groups.AddToGroupAsync(Context.ConnectionId, chatRoomId!);

        var result =
            await mediator.Send(new GetMessages.Query { ChatRoomId = chatRoomId! });

        await Clients.Caller.SendAsync("LoadMessages", result.Value);
    }
}
