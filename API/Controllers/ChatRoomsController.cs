using Application.ChatRooms.Commands;
using Application.ChatRooms.DTOs;
using Application.ChatRooms.Queries;
using Application.Chats.Commands;
using Application.Core;
using Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ChatRoomsController : BaseApiController
{
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
    public async Task<ActionResult<ChatRoomDto>> GetChatRoomDetails(string id)
    {
        return HandleResult(await Mediator.Send(new GetChatRoomDetails.Query { Id = id }));
    }

    [HttpPost]
    public async Task<ActionResult<string>> CreateChatRoom(CreateChatRoomDto createChatRoomDto)
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

    [HttpDelete("{id}")]
    [Authorize(Policy = IsAdminStrings.IsChatRoomAdmin)]
    public async Task<ActionResult<Unit>> DeleteChatRoom(string id)
    {
        return HandleResult(await Mediator.Send(new DeleteChatRoom.Command { Id = id }));
    }

    [HttpPost("{id}/{token}/join")]
    public async Task<ActionResult<Unit>> JoinChatRoom(string id, string token)
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
    [Authorize(Policy = IsAdminStrings.IsChatRoomAdmin)]
    public async Task<ActionResult<string>> GenerateInviteLink(string id)
    {
        return HandleResult(await Mediator.Send(new GenerateInviteLink.Command { Id = id }));
    }
}
