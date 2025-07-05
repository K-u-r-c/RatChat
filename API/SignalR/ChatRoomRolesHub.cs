using Application.ChatRoomRoles.Commands;
using Application.ChatRoomRoles.DTOs;
using Application.ChatRoomRoles.Queries;
using MediatR;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

public class ChatRoomRolesHub(IMediator mediator) : Hub
{
    public async Task<List<ChatRoomRoleDto>> GetRoles(string chatRoomId)
    {
        var result = await mediator.Send(new GetChatRoomRoles.Query { ChatRoomId = chatRoomId });
        if (result.IsSuccess && result.Value != null)
        {
            return result.Value;
        }
        else
        {
            throw new HubException("Failed to retrieve roles");
        }
    }

    public async Task CreateRole(CreateChatRoomRoleDto dto)
    {
        var result = await mediator.Send(new CreateChatRoomRole.Command { CreateChatRoomRoleDto = dto });
        if (result.IsSuccess && result.Value != null)
        {
            await Clients.Group(dto.ChatRoomId).SendAsync("RoleCreated", result.Value);
        }
        else
        {
            throw new HubException("Failed to create role");
        }
    }

    public async Task UpdateRole(UpdateChatRoomRoleDto dto)
    {
        var result = await mediator.Send(new UpdateRoleAsync.Command { UpdateChatRoomRoleDto = dto });
        if (result.IsSuccess)
        {
            if (result.Value == null)
            {
                throw new HubException("Role not found");
            }
            await Clients.Group(result.Value.ChatRoomId).SendAsync("RoleUpdated", result.Value);
        }
        else
        {
            throw new HubException("Failed to update role");
        }
    }

    public async Task DeleteRole(string roleId, string chatRoomId)
    {
        var result = await mediator.Send(new DeleteChatRoomRole.Command { ChatRoomRoleId = roleId });
        if (result.IsSuccess)
        {
            await Clients.Group(chatRoomId).SendAsync("RoleDeleted", roleId);
        }
        else
        {
            throw new HubException("Failed to delete role");
        }
    }

    public async Task AssignRole(AssignChatRoomRoleDto dto)
    {
        var result = await mediator.Send(new AssignRoleAsync.Command { AssignChatRoomRoleDto = dto });
        if (result.IsSuccess && result.Value != null)
        {
            await Clients.Group(dto.Id).SendAsync("RoleAssigned", result.Value);
        }
        else
        {
            throw new HubException("Failed to assign role");
        }
    }

    public async Task UnassignRole(UnassignChatRoomRoleDto dto)
    {
        var result = await mediator.Send(new UnassignRoleAsync.Command { UnassignChatRoomRoleDto = dto });
        if (result.IsSuccess)
        {
            await Clients.Group(dto.Id).SendAsync("RoleUnassigned", dto);
        }
        else
        {
            throw new HubException("Failed to unassign role");
        }
    }

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var chatRoomId = httpContext?.Request.Query["chatRoomId"];

        if (string.IsNullOrEmpty(chatRoomId)) throw new HubException("No chat room with this id");

        await Groups.AddToGroupAsync(Context.ConnectionId, chatRoomId!);


        var result = await mediator.Send(new GetChatRoomRoles.Query { ChatRoomId = chatRoomId! });

        if (result.IsSuccess && result.Value != null)
        {
            await Clients.Caller.SendAsync("LoadChatRoomRoles", result.Value);
        }
        else
        {
            throw new HubException("Failed to load chat room roles");
        }
        
        await base.OnConnectedAsync();
    }
}
