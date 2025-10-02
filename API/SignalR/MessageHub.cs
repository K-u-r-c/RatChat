using Application.Core;
using Application.Interfaces;
using Application.Messages.Commands;
using Application.Messages.Queries;
using Application.Messages.SignalR;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace API.SignalR;

[Authorize]
public class MessageHub(
    IMediator mediator,
    IRolePermissionService rolePermissionService,
    IUserAccessor userAccessor,
    IChatRoomsNotificationService chatRoomsNotificationService,
    AppDbContext context
) : Hub
{
    internal static string GetChatRoomGroup(string chatRoomId) => $"chatroom-{chatRoomId}";
    internal static string GetChannelGroup(string channelId) => $"channel-{channelId}";

    [Authorize(Policy = ChatRoomPermissions.SendMessages)]
    public async Task SendMessage(AddMessage.Command command)
    {
        if (string.IsNullOrWhiteSpace(command.ChannelId))
        {
            await Clients.Caller.SendAsync("ReceiveError", 400, "Channel is required");
            return;
        }

        try
        {
            var message = await HandleSendMessage.TrySendMessageAsync(mediator, command);

            if (message.Value == null)
            {
                throw new SendMessageHubException("Message without content", ErrorCodes.WillNotBeProcessed);
            }

            await Clients.Group(GetChannelGroup(message.Value.ChannelId))
                .SendAsync("ChatRoomMessage", message.Value);

            await chatRoomsNotificationService.NotifyChatRoomUpdated(command.ChatRoomId, message.Value);
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
        if (string.IsNullOrWhiteSpace(command.ChannelId))
        {
            await Clients.Caller.SendAsync("ReceiveError", 400, "Channel is required");
            return;
        }

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

            await Clients.Group(GetChannelGroup(message.Value.ChannelId))
                .SendAsync("ChatRoomMessage", message.Value);

            await chatRoomsNotificationService.NotifyChatRoomUpdated(command.ChatRoomId, message.Value);
        }
        catch (SendMessageHubException hubException)
        {
            if (hubException.ErrorCode == ErrorCodes.WillNotBeProcessed) return;

            await Clients.Caller.SendAsync("ReceiveError", hubException.ErrorCode, hubException.Message);
        }
    }

    [Authorize(Policy = ChatRoomPermissions.ViewChatRoom)]
    public async Task LoadMoreMessages(string chatRoomId, string channelId, DateTime? cursor, int pageSize = 20)
    {
        try
        {
            var result = await mediator.Send(
                new GetMessages.Query
                {
                    ChatRoomId = chatRoomId,
                    ChannelId = channelId,
                    Cursor = cursor,
                    PageSize = pageSize
                }
            );

            await Clients.Caller.SendAsync("ReceiveOlderMessages", new
            {
                chatRoomId,
                channelId,
                data = result.Value
            });
        }
        catch
        {
            await Clients.Caller.SendAsync("ReceiveError", 500, "Failed to load more messages");
        }
    }

    [Authorize(Policy = ChatRoomPermissions.SendMessages)]
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
                var payload = result.Value;
                if (payload == null)
                {
                    await Clients.Caller.SendAsync("ReceiveError", 500, "Failed to toggle reaction");
                    return;
                }

                if (!string.IsNullOrWhiteSpace(payload.ChannelId))
                {
                    await Clients.Group(GetChannelGroup(payload.ChannelId))
                        .SendAsync("ReceiveReactionUpdate", payload);
                }
                else
                {
                    await Clients.Group(GetChatRoomGroup(chatRoomId))
                        .SendAsync("ReceiveReactionUpdate", payload);
                }
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
        var defaultChannelId = await context.ChatChannels
            .Where(c => c.ChatRoomId == chatRoomId && c.Type == ChatChannelType.Text)
            .OrderBy(c => c.Position)
            .Select(c => c.Id)
            .FirstOrDefaultAsync();

        if (defaultChannelId == null)
        {
            await Clients.Caller.SendAsync("ReceiveError", 404, "No text channel available for this chat room");
            return;
        }

        await JoinChatChannel(chatRoomId, defaultChannelId, initialPageSize);
    }

    public async Task JoinChatChannel(string chatRoomId, string channelId, int? initialPageSize = null)
    {
        var user = await userAccessor.GetUserAsync();
        var hasAccess = await rolePermissionService.HasPermissionAsync(
            user.Id, chatRoomId, ChatRoomPermissions.ViewChatRoom);

        if (!hasAccess)
        {
            await Clients.Caller.SendAsync("ReceiveError", 403, "You are not a member of this chat room");
            return;
        }

        var channel = await context.ChatChannels
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.ChatRoomId == chatRoomId && c.Id == channelId,
                Context.ConnectionAborted);

        if (channel == null)
        {
            await Clients.Caller.SendAsync("ReceiveError", 404, "Channel not found");
            return;
        }

        if (channel.Type != ChatChannelType.Text)
        {
            await Clients.Caller.SendAsync("ReceiveError", 400, "Cannot join a non-text channel for messaging");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GetChatRoomGroup(chatRoomId));
        await RemoveFromChatRoomChannelGroups(chatRoomId);
        await Groups.AddToGroupAsync(Context.ConnectionId, GetChannelGroup(channelId));

        var size = initialPageSize ?? 20;
        var result = await mediator.Send(
            new GetMessages.Query
            {
                ChatRoomId = chatRoomId,
                ChannelId = channelId,
                PageSize = size
            }
        );

        await Clients.Caller.SendAsync("LoadMessages", new
        {
            chatRoomId,
            channelId,
            data = result.Value
        });
    }

    public async Task LeaveChatRoom(string chatRoomId, string? channelId = null)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetChatRoomGroup(chatRoomId));

        if (!string.IsNullOrWhiteSpace(channelId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetChannelGroup(channelId));
        }
        else
        {
            await RemoveFromChatRoomChannelGroups(chatRoomId);
        }
    }

    private async Task RemoveFromChatRoomChannelGroups(string chatRoomId)
    {
        var channelIds = await context.ChatChannels
            .Where(c => c.ChatRoomId == chatRoomId && c.Type == ChatChannelType.Text)
            .Select(c => c.Id)
            .ToListAsync(Context.ConnectionAborted);

        foreach (var channelId in channelIds)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetChannelGroup(channelId));
        }
    }
}
