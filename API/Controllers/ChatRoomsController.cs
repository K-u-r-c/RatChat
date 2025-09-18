using API.SignalR;
using Application.ChatRooms.Commands;
using Application.ChatRooms.DTOs;
using Application.ChatRooms.Queries;
using Application.Core;
using Domain.Enums;
using Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace API.Controllers;

public class ChatRoomsController(IHubContext<ChatRoomNotificationsHub> hubContext) : BaseApiController
{
    private readonly IHubContext<ChatRoomNotificationsHub> _hubContext = hubContext;

    [HttpGet]
    public async Task<ActionResult<PagedList<ChatRoomDto, DateTime?>>> GetChatRooms(
        [FromQuery] ChatRoomParams chatRoomParams
    )
    {
        return HandleResult(await Mediator.Send(
            new GetChatRoomList.Query { Params = chatRoomParams })
        );
    }

    [HttpGet("{id}")]
    [Authorize(Policy = ChatRoomPermissions.ViewChatRoom)]
    public async Task<ActionResult<ChatRoomDto>> GetChatRoomDetails(string id)
    {
        return HandleResult(await Mediator.Send(new GetChatRoomDetails.Query { Id = id }));
    }

    [HttpPost]
    public async Task<ActionResult<ChatRoomIdentifierDto>> CreateChatRoom(CreateChatRoomDto createChatRoomDto)
    {
        return HandleResult(
            await Mediator.Send(
                new CreateChatRoom.Command
                {
                    CreateChatRoomDto = createChatRoomDto
                }
            )
        );
    }

    [HttpPut("{id}")]
    [Authorize(Policy = IsAdminStrings.IsChatRoomAdmin)]
    public async Task<ActionResult<Unit>> UpdateChatRoom(string id, EditChatRoomDto chatRoomDto)
    {
        chatRoomDto.Id = id;
        return HandleResult(
            await Mediator.Send(new EditChatRoom.Command { ChatRoomDto = chatRoomDto })
        );
    }

    [HttpPut("{id}/image")]
    [Authorize(Policy = IsAdminStrings.IsChatRoomAdmin)]
    public async Task<ActionResult<Unit>> UpdateChatRoomImage(string id, SetChatRoomImageDto setChatRoomImageDto)
    {
        setChatRoomImageDto.Id = id;
        return HandleResult(
            await Mediator.Send(
                new UpdateChatRoomImage.Command { Dto = setChatRoomImageDto }
            )
        );
    }

    [HttpDelete("{id}/image")]
    [Authorize(Policy = IsAdminStrings.IsChatRoomAdmin)]
    public async Task<ActionResult<Unit>> DeleteChatRoomImage(string id)
    {
        return HandleResult(
            await Mediator.Send(new DeleteChatRoomImage.Command { Id = id })
        );
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = IsAdminStrings.IsChatRoomAdmin)]
    public async Task<ActionResult<Unit>> DeleteChatRoom(string id)
    {
        return HandleResult(await Mediator.Send(new DeleteChatRoom.Command { Id = id }));
    }

    [HttpPost("{id}/{token}/join")]
    public async Task<ActionResult<ChatRoomIdentifierDto>> JoinChatRoom(string id, string token)
    {
        return HandleResult(await Mediator.Send(
            new JoinChatRoom.Command
            {
                Id = id,
                Token = token
            }
        ));
    }

    [HttpPost("{id}/leave")]
    public async Task<ActionResult<Unit>> LeaveChatRoom(string id)
    {
        return HandleResult(await Mediator.Send(new LeaveChatRoom.Command { Id = id }));
    }

    [HttpPost("{id}/generateInviteLink")]
    [Authorize(Policy = ChatRoomPermissions.CreateInviteLinks)]
    public async Task<ActionResult<string>> GenerateInviteLink(string id, [FromBody] GenerateInviteLink.Command? command)
    {
        var resolvedCommand = command ?? new GenerateInviteLink.Command { Id = id };
        resolvedCommand.Id = id;
        return HandleResult(await Mediator.Send(resolvedCommand));
    }

    [HttpPost("{id}/invites")]
    [Authorize(Policy = ChatRoomPermissions.CreateInviteLinks)]
    public async Task<ActionResult<string>> CreateInvite(string id, [FromBody] CreateInvite.Command command)
    {
        command.Id = id;
        return HandleResult(await Mediator.Send(command));
    }

    [HttpPost("{id}/kick/{user_id}")]
    [Authorize(Policy = ChatRoomPermissions.KickFromChatRoom)]
    public async Task<ActionResult<string>> KickChatRoomUser(string id, string user_id)
    {
        var result = await Mediator.Send(
            new KickUser.Command
            {
                ChatRoomId = id,
                UserId = user_id
            }
        );

        if (result.IsSuccess)
        {
            await _hubContext.Clients.Group(id).SendAsync("UserKicked", result.Value);
        }

        return HandleResult(result);
    }

    [HttpPost("{id}/ban/{user_id}")]
    [Authorize(Policy = ChatRoomPermissions.BanFromChatRoom)]
    public async Task<ActionResult<Unit>> BanChatRoomUser(string id, string user_id)
    {
        var result = await Mediator.Send(
            new BanUser.Command
            {
                ChatRoomBanDto = new ChatRoomBanDto
                {
                    UserId = user_id,
                    ChatRoomId = id,
                    DateBanned = DateTime.UtcNow
                }
            }
        );

        if (result.IsSuccess)
        {
            await _hubContext.Clients.Group(id).SendAsync("UserBanned", result.Value);
        }

        return HandleResult(result);
    }

    [HttpPost("{id}/unban/{user_id}")]
    [Authorize(Policy = ChatRoomPermissions.UnbanFromChatRoom)]
    public async Task<ActionResult<Unit>> UnbanChatRoomUser(string id, string user_id)
    {
        var result = await Mediator.Send(
            new UnbanUser.Command
            {
                ChatRoomBanDto = new ChatRoomBanDto
                {
                    UserId = user_id,
                    ChatRoomId = id
                }
            }
        );

        if (result.IsSuccess)
        {
            await _hubContext.Clients.Group(id).SendAsync("UserUnbanned", result.Value);
        }

        return HandleResult(result);
    }

}
