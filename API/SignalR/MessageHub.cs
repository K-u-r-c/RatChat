using System.Security.Claims;
using Application.Core;
using Application.Interfaces;
using Application.Messages.Commands;
using Application.Messages.Queries;
using Application.Messages.SignalR;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

public class MessageHub(IMediator mediator, IRolePermissionService rolePermissionService) : Hub
{
    [Authorize(Policy = ChatRoomPermissions.SendMessages)]
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

    [Authorize(Policy = ChatRoomPermissions.SendMessages)]
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

    [Authorize(Policy = ChatRoomPermissions.ViewChatRoom)]
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

    [Authorize(Policy = ChatRoomPermissions.ViewChatRoom)]
    public async Task ToggleMessageReaction(string chatRoomId, string messageId, string emoji)
    {
        try
        {
            var result = await mediator.Send(new ToggleMessageReaction.Command
            {
                ChatRoomId = chatRoomId,
                MessageId = messageId,
                Emoji = emoji
            });

            if (result.IsSuccess)
            {
                await Clients.Group(chatRoomId).SendAsync("ReceiveReactionUpdate", result.Value);
            }
            else
            {
                await Clients.Caller.SendAsync("ReceiveError", result.Code, result.Error);
            }
        }
        catch
        {
            await Clients.Caller.SendAsync("ReceiveError", 500, "Failed to toggle reaction");
        }
    }

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var chatRoomId = httpContext?.Request.Query["chatRoomId"];
        if (string.IsNullOrEmpty(chatRoomId)) throw new HubException("No chat room with this id");

        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            throw new HubException("Unauthenticated user");
        }

        var hasAccess = await rolePermissionService.HasPermissionAsync(
            userId!, chatRoomId!, ChatRoomPermissions.ViewChatRoom);

        if (!hasAccess)
        {
            await Clients.Caller.SendAsync("ReceiveError", 403, "You are not a member of this chat room");
            Context.Abort();
            return;
        }

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
