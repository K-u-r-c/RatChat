using Application.ChatRoomRoles.Commands;
using Application.ChatRoomRoles.DTOs;
using Application.ChatRoomRoles.Queries;
using MediatR;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

public class ChatRoomRolesHub(IMediator mediator) : Hub
{
    public async Task CreateRole(CreateChatRoomRoleDto dto)
    {
        var result = await mediator.Send(
            new CreateChatRoomRole.Command { CreateChatRoomRoleDto = dto });
        if (result.IsSuccess && result.Value != null)
        {
            await Clients.Group(dto.ChatRoomId).SendAsync("RoleCreated", result.Value);
        }
        else
        {
            throw new HubException("Failed to create role");
        }
    }

     public async Task<List<ChatRoomRoleDto>> GetRoles(string chatRoomId)
    {
        var result = await mediator.Send(
            new GetChatRoomRoles.Query { ChatRoomId = chatRoomId });
        if (result.IsSuccess && result.Value != null)
        {
            return result.Value;
        }
        else
        {
            throw new HubException("Failed to retrieve roles");
        }
    }

    public async Task<List<ChatRoomRoleDto>> GetUserRoles(string chatRoomId, string userId)
    {
        var result = await mediator.Send(
            new GetUserChatRoomRoles.Query { ChatRoomId = chatRoomId, UserId = userId });
        if (result.IsSuccess && result.Value != null)
        {
            return result.Value;
        }
        else
        {
            throw new HubException("Failed to retrieve user roles");
        }
    }

    public async Task<List<ChatRoomPermissionDto>> GetUserPermissions(string chatRoomId, string userId)
    {
        var result = await mediator.Send(
            new GetUserPermissions.Query { ChatRoomId = chatRoomId, UserId = userId });
        if (result.IsSuccess && result.Value != null)
        {
            return result.Value;
        }
        else
        {
            throw new HubException("Failed to retrieve user permissions");
        }
    }

    public async Task UpdateRole(UpdateChatRoomRoleDto dto)
    {
        var result = await mediator.Send(
            new UpdateChatRoomRole.Command { UpdateChatRoomRoleDto = dto });
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
        var result = await mediator.Send(
            new DeleteChatRoomRole.Command { ChatRoomRoleId = roleId });
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
        var result = await mediator.Send(
            new AssignChatRoomRole.Command { AssignChatRoomRoleDto = dto });
        if (result.IsSuccess && result.Value != null)
        {
            await Clients.Group(dto.ChatRoomId).SendAsync("RoleAssigned", result.Value);
        }
        else
        {
            throw new HubException("Failed to assign role");
        }
    }

    public async Task UnassignRole(UnassignChatRoomRoleDto dto)
    {
        var result = await mediator.Send(
            new UnassignChatRoomRole.Command { UnassignChatRoomRoleDto = dto });
        if (result.IsSuccess && result.Value != null)
        {
            await Clients.Group(dto.ChatRoomId).SendAsync("RoleUnassigned", result.Value);
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

        var chatRoomRoles = await mediator.Send(
            new GetChatRoomRoles.Query { ChatRoomId = chatRoomId! });

        if (chatRoomRoles.IsSuccess && chatRoomRoles.Value != null)
        {
            await Clients.Caller.SendAsync("LoadChatRoomRoles", chatRoomRoles.Value);
        }
        else
        {
            throw new HubException("Failed to load chat room roles");
        }

        var usersRoles = await mediator.Send(
            new GetUsersChatRoomRoles.Query { ChatRoomId = chatRoomId! });

        if (usersRoles.IsSuccess && usersRoles.Value != null)
        {
            await Clients.Caller.SendAsync("UsersRoleLoaded", usersRoles.Value);
        }
        else
        {
            throw new HubException("Failed to load members roles");
        }

        await base.OnConnectedAsync();
    }
}
