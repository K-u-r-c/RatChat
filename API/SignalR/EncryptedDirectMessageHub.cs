using Application.Core;
using Application.EncryptedDirectMessages.Commands;
using Application.EncryptedDirectMessages.Queries;
using Application.Messages.SignalR;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

public class EncryptedDirectMessageHub(
    IMediator mediator,
    IEncryptedDirectMessagesNotificationService notificationService
) : Hub
{
    public async Task SendEncryptedMessage(SendEncryptedDirectMessage.Command command)
    {
        try
        {
            var result = await mediator.Send(command);

            if (!result.IsSuccess || result.Value == null)
            {
                throw new SendMessageHubException(result.Error ?? "Failed to send encrypted message", result.Code);
            }

            await Clients.Group(command.EncryptedDirectChatId)
                .SendAsync("ReceiveEncryptedDirectMessage", result.Value);

            await notificationService.NotifyNewMessage(command.EncryptedDirectChatId, result.Value);
        }
        catch (SendMessageHubException hubException)
        {
            if (hubException.ErrorCode == ErrorCodes.WillNotBeProcessed) return;

            await Clients.Caller.SendAsync("ReceiveError", hubException.ErrorCode, hubException.Message);
        }
    }

    public async Task ToggleEncryptedMessageReaction(string encryptedDirectChatId, string encryptedDirectMessageId, string emoji)
    {
        try
        {
            var reaction = await mediator.Send(new ToggleEncryptedDirectMessageReaction.Command
            {
                EncryptedDirectChatId = encryptedDirectChatId,
                EncryptedDirectMessageId = encryptedDirectMessageId,
                Emoji = emoji
            });

            if (reaction.IsSuccess && reaction.Value is not null)
            {
                await Clients.OthersInGroup(encryptedDirectChatId)
                    .SendAsync("ReceiveEncryptedReactionUpdate", reaction.Value);
            }
            else if (!reaction.IsSuccess)
            {
                await Clients.Caller.SendAsync("ReceiveError", reaction.Code, reaction.Error);
            }
        }
        catch
        {
            await Clients.Caller.SendAsync("ReceiveError", 500, "Failed to toggle reaction");
        }
    }

    public async Task LoadMoreEncryptedMessages(string encryptedDirectChatId, DateTime? cursor, int pageSize = 20)
    {
        try
        {
            var result = await mediator.Send(new GetEncryptedDirectMessages.Query
            {
                EncryptedDirectChatId = encryptedDirectChatId,
                Cursor = cursor,
                PageSize = pageSize
            });

            if (result.Value != null)
            {
                await Clients.Caller.SendAsync("ReceiveOlderEncryptedMessages", result.Value);
            }
        }
        catch
        {
            await Clients.Caller.SendAsync("ReceiveError", 500, "Failed to load more encrypted messages");
        }
    }

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var chatId = httpContext?.Request.Query["encryptedDirectChatId"];

        if (string.IsNullOrEmpty(chatId))
        {
            throw new HubException("No encrypted direct chat id provided");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, chatId!);

        var initialPageSize =
            int.TryParse(httpContext?.Request.Query["initialPageSize"], out var size) ? size : 20;

        var result = await mediator.Send(new GetEncryptedDirectMessages.Query
        {
            EncryptedDirectChatId = chatId!,
            PageSize = initialPageSize
        });

        if (result.Value != null)
        {
            await Clients.Caller.SendAsync("LoadEncryptedDirectMessages", result.Value);
        }
    }
}
