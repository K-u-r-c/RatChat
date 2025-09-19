using System.Security.Claims;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Infrastructure.Security;

public class HasPermissionRequirement(string permissionName) : IAuthorizationRequirement
{
    public string PermissionName { get; } = permissionName;
}

public class HasPermissionRequirementHandler(
    IRolePermissionService rolePermissionService,
    IHttpContextAccessor httpContextAccessor,
    AppDbContext dbContext
    ) : AuthorizationHandler<HasPermissionRequirement>
{
    private static readonly string[] RouteKeys = ["chatRoomId", "id", "slug", "chatRoomSlug"];
    private static readonly HashSet<string> MethodsWithStringIdentifier = new(
        StringComparer.OrdinalIgnoreCase)
    {
        "LoadMoreMessages",
        "ToggleMessageReaction",
        "JoinChatRoom",
        "LeaveChatRoom"
    };

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, HasPermissionRequirement requirement)
    {
        if (requirement.PermissionName == ChatRoomPermissions.SendMessages)
        {
            ;
        }

        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            context.Fail(new AuthorizationFailureReason(this, "User identifier not found."));
            return;
        }

        var identifier = context.Resource switch
        {
            HubInvocationContext hubContext => ResolveChatRoomIdentifier(hubContext)
                ?? ResolveChatRoomIdentifier(hubContext.Context.GetHttpContext()),
            HttpContext resourceHttpContext => ResolveChatRoomIdentifier(resourceHttpContext),
            _ => ResolveChatRoomIdentifier(httpContextAccessor.HttpContext)
        };

        if (string.IsNullOrWhiteSpace(identifier))
        {
            context.Fail(new AuthorizationFailureReason(this, "Chat room identifier missing from request."));
            return;
        }

        var cancellationToken = httpContextAccessor.HttpContext?.RequestAborted ?? CancellationToken.None;
        var chatRoomId = await ResolveChatRoomIdAsync(identifier, cancellationToken);

        if (string.IsNullOrWhiteSpace(chatRoomId))
        {
            context.Fail(new AuthorizationFailureReason(this, "Chat room could not be resolved."));
            return;
        }

        try
        {
            var result = await rolePermissionService.HasPermissionAsync(
                userId,
                chatRoomId,
                requirement.PermissionName);

            if (result)
            {
                context.Succeed(requirement);
            }
            else
            {
                context.Fail(new AuthorizationFailureReason(this, "User does not have the required permission."));
            }
        }
        catch
        {
            context.Fail(new AuthorizationFailureReason(this, "There was an error with checking permission."));
        }
    }

    private string? ResolveChatRoomIdentifier(HubInvocationContext hubContext)
    {
        if (hubContext == null) return null;

        var fromArgs = TryResolveFromHubArguments(hubContext);
        if (!string.IsNullOrWhiteSpace(fromArgs))
        {
            return fromArgs;
        }

        return ResolveChatRoomIdentifier(hubContext.Context.GetHttpContext());
    }

    private string? TryResolveFromHubArguments(HubInvocationContext hubContext)
    {
        if (hubContext.HubMethodArguments is not { Count: > 0 }) return null;

        foreach (var argument in hubContext.HubMethodArguments)
        {
            if (argument == null) continue;

            if (argument is string stringArg && !string.IsNullOrWhiteSpace(stringArg))
            {
                if (MethodsWithStringIdentifier.Contains(hubContext.HubMethodName))
                {
                    return stringArg;
                }

                continue;
            }

            var chatRoomIdProperty = argument.GetType().GetProperty("ChatRoomId");
            if (chatRoomIdProperty?.GetValue(argument) is string value && !string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }

    private string? ResolveChatRoomIdentifier(HttpContext? httpContext)
    {
        if (httpContext == null) return null;

        foreach (var key in RouteKeys)
        {
            if (httpContext.GetRouteValue(key) is string value && !string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        foreach (var key in RouteKeys)
        {
            var queryValue = httpContext.Request.Query[key];
            if (!string.IsNullOrWhiteSpace(queryValue))
            {
                return queryValue.ToString();
            }
        }

        return null;
    }

    private async Task<string?> ResolveChatRoomIdAsync(string identifier, CancellationToken cancellationToken)
    {
        if (Guid.TryParse(identifier, out _))
        {
            var exists = await dbContext.ChatRooms
                .AsNoTracking()
                .AnyAsync(cr => cr.Id == identifier, cancellationToken);

            if (exists)
            {
                return identifier;
            }
        }

        return await dbContext.ChatRooms
            .AsNoTracking()
            .Where(cr => cr.Slug == identifier)
            .Select(cr => cr.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }
}

