using Application.ChatChannels.Commands;
using Application.ChatRooms.DTOs;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using API.SignalR;
using Application.ChatChannels.DTOs;

namespace API.Controllers;

[Route("api/chatrooms/{chatRoomId}/channels")]
public class ChatChannelsController(IHubContext<MessageHub> messageHubContext) : BaseApiController
{
    [HttpPost]
    [Authorize(Policy = ChatRoomPermissions.ManageChannels)]
    public async Task<ActionResult<ChatChannelDto>> CreateChannel(
        string chatRoomId,
        [FromBody] CreateChatChannelRequest request)
    {
        var command = new CreateChatChannel.Command
        {
            ChatRoomId = chatRoomId,
            Name = request.Name,
            Type = request.Type
        };

        var result = await Mediator.Send(command);

        if (result.IsSuccess && result.Value != null)
        {
            await messageHubContext.Clients
                .Group(MessageHub.GetChatRoomGroup(chatRoomId))
                .SendAsync("ChannelCreated", result.Value);
        }

        return HandleResult(result);
    }

    [HttpPut("{channelId}")]
    [Authorize(Policy = ChatRoomPermissions.ManageChannels)]
    public async Task<ActionResult<ChatChannelDto>> UpdateChannel(
        string chatRoomId,
        string channelId,
        [FromBody] UpdateChatChannelRequest request)
    {
        var command = new UpdateChatChannel.Command
        {
            ChatRoomId = chatRoomId,
            ChannelId = channelId,
            Name = request.Name,
            Position = request.Position
        };

        var result = await Mediator.Send(command);

        if (result.IsSuccess && result.Value != null)
        {
            await messageHubContext.Clients
                .Group(MessageHub.GetChatRoomGroup(chatRoomId))
                .SendAsync("ChannelUpdated", result.Value);
        }

        return HandleResult(result);
    }

    [HttpDelete("{channelId}")]
    [Authorize(Policy = ChatRoomPermissions.ManageChannels)]
    public async Task<ActionResult> DeleteChannel(string chatRoomId, string channelId)
    {
        var command = new DeleteChatChannel.Command
        {
            ChatRoomId = chatRoomId,
            ChannelId = channelId
        };

        var result = await Mediator.Send(command);

        if (result.IsSuccess)
        {
            await messageHubContext.Clients
                .Group(MessageHub.GetChatRoomGroup(chatRoomId))
                .SendAsync("ChannelDeleted", new
                {
                    chatRoomId,
                    channelId
                });
        }

        return HandleResult(result);
    }
}
