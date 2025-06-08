using Microsoft.AspNetCore.SignalR;

namespace Application.Messages.SignalR;

public class SendMessageHubException : HubException
{
    public int ErrorCode { get; }

    public SendMessageHubException(string message, int errorCode) : base(message)
    {
        ErrorCode = errorCode;
    }
}
