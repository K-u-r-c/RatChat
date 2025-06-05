using Application.Core;
using Application.Messages.Commands;
using Application.Messages.DTOs;
using MediatR;
using Microsoft.AspNetCore.SignalR;

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

public class SendMessageHubException : HubException
    {
        public int ErrorCode { get; }

        public SendMessageHubException(string message, int errorCode) : base(message)
        {
            ErrorCode = errorCode;
        }
    }
