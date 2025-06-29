using Application.ChatRoomRoles.Commands;
using Application.ChatRoomRoles.DTOs;
using Application.ChatRoomRoles.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ChatRoomRolesController : BaseApiController
{
    [HttpGet("{chatRoomId}")]
    public async Task<ActionResult<List<ChatRoomRoleDto>>> GetRoles(string chatRoomId)
    {
        return HandleResult(await Mediator.Send(new GetChatRoomRoles.Query { ChatRoomId = chatRoomId }));
    }

    [HttpGet("{chatRoomId}/user/{userId}")]
    public async Task<ActionResult<List<ChatRoomRoleDto>>> GetUserRoles(string chatRoomId, string userId)
    {
        return HandleResult(await Mediator.Send(new GetUserChatRoomRoles.Query
        {
            ChatRoomId = chatRoomId,
            UserId = userId
        }));
    }

    [HttpGet("{chatRoomId}/permissions/{userId}")]
    public async Task<ActionResult<List<ChatRoomPermissionDto>>> GetUserPermissions(string chatRoomId, string userId)
    {
        return HandleResult(await Mediator.Send(new GetUserPermissions.Query
        {
            ChatRoomId = chatRoomId,
            UserId = userId
        }));
    }

    [HttpPost]
    public async Task<ActionResult<ChatRoomRoleDto>> CreateRole(CreateChatRoomRoleDto dto)
    {
        return HandleResult(await Mediator.Send(new CreateChatRoomRole.Command
        {
            CreateChatRoomRoleDto = dto
        }));
    }

    [HttpPut]
    public async Task<ActionResult<Unit>> UpdateRole(UpdateChatRoomRoleDto dto)
    {
        return HandleResult(await Mediator.Send(new UpdateRoleAsync.Command
        {
            UpdateChatRoomRoleDto = dto
        }));
    }

    [HttpDelete("{roleId}")]
    public async Task<ActionResult<Unit>> DeleteRole(string roleId)
    {
        return HandleResult(await Mediator.Send(new DeleteChatRoomRole.Command
        {
            ChatRoomRoleId = roleId
        }));
    }

    [HttpPost("assign")]
    public async Task<ActionResult<MemberRoleDto>> AssignRole(AssignChatRoomRoleDto dto)
    {
        return HandleResult(await Mediator.Send(new AssignRoleAsync.Command
        {
            AssignChatRoomRoleDto = dto
        }));
    }

    [HttpPost("unassign")]
    public async Task<ActionResult<Unit>> UnassignRole(UnassignChatRoomRoleDto dto)
    {
        return HandleResult(await Mediator.Send(new UnassignRoleAsync.Command
        {
            UnassignChatRoomRoleDto = dto
        }));
    }
}
