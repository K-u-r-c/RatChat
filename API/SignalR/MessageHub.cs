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

[Authorize]
public class MessageHub(
    IMediator mediator,
    IRolePermissionService rolePermissionService,
    IUserAccessor userAccessor,
    IChatRoomsNotificationService chatRoomsNotificationService
) : Hub
{
    public async Task SendMessage(AddMessage.Command command)
    {
        try
        {
            var message = await HandleSendMessage.TrySendMessageAsync(mediator, command);

            if (message.Value == null)
            {
                throw new SendMessageHubException("Message without content", ErrorCodes.WillNotBeProcessed);
            }

            await Clients.Group($"chatroom-{command.ChatRoomId}")
                .SendAsync("ChatRoomMessage", message.Value);

            await chatRoomsNotificationService.NotifyChatRoomUpdated(command.ChatRoomId, message.Value);
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

            if (message.Value == null)
            {
                throw new SendMessageHubException("Message without content", ErrorCodes.WillNotBeProcessed);
            }

            await Clients.Group($"chatroom-{command.ChatRoomId}")
                .SendAsync("ChatRoomMessage", message.Value);

            await chatRoomsNotificationService.NotifyChatRoomUpdated(command.ChatRoomId, message.Value);
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
            var user = await userAccessor.GetUserAsync();
            var hasAccess = await rolePermissionService.HasPermissionAsync(
                user.Id, chatRoomId, ChatRoomPermissions.ViewChatRoom);

            if (!hasAccess)
            {
                await Clients.Caller.SendAsync("ReceiveError", 403, "You are not a member of this chat room");
                return;
            }

            var result = await mediator.Send(
                new GetMessages.Query
                {
                    ChatRoomId = chatRoomId,
                    Cursor = cursor,
                    PageSize = pageSize
                }
            );

            await Clients.Caller.SendAsync("ReceiveOlderMessages", new
            {
                chatRoomId,
                data = result.Value
            });
        }
        catch
        {
            await Clients.Caller.SendAsync("ReceiveError", 500, "Failed to load more messages");
        }
    }

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
                await Clients.Group($"chatroom-{chatRoomId}").SendAsync("ReceiveReactionUpdate", result.Value);
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
        var user = await userAccessor.GetUserAsync();
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{user.Id}");

        await base.OnConnectedAsync();
    }

    public async Task JoinChatRoom(string chatRoomId, int? initialPageSize = null)
    {
        var user = await userAccessor.GetUserAsync();
        var hasAccess = await rolePermissionService.HasPermissionAsync(
            user.Id, chatRoomId, ChatRoomPermissions.ViewChatRoom);

        if (!hasAccess)
        {
            await Clients.Caller.SendAsync("ReceiveError", 403, "You are not a member of this chat room");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"chatroom-{chatRoomId}");

        var size = initialPageSize ?? 20;
        var result = await mediator.Send(
            new GetMessages.Query
            {
                ChatRoomId = chatRoomId,
                PageSize = size
            }
        );

        await Clients.Caller.SendAsync("LoadMessages", new
        {
            chatRoomId,
            data = result.Value
        });
    }

    public async Task LeaveChatRoom(string chatRoomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"chatroom-{chatRoomId}");
    }
}
