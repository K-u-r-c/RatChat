using Application.Core;
using Application.Messages.Commands;
using Application.Messages.DTOs;
using MediatR;

namespace Application.Messages.SignalR;

public class HandleSendMessage
{
    public static async Task<Result<MessageDto>> TrySendMessageAsync(
        IMediator mediator, AddMessage.Command command)
    {
        Result<MessageDto>? message = await mediator.Send(command);

        if (!message.IsSuccess || message.Value == null)
            throw new SendMessageHubException(message.Error ?? "Failed to add message", message.Code);

        return message;
    }
}
