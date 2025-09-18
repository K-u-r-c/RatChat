using System.Security.Claims;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Infrastructure.Security;

public class HasPermissionRequirement(string permissionName) : IAuthorizationRequirement
{
    public string PermissionName { get; } = permissionName;
}

public class HasPermissionRequirementHandler(
    IRolePermissionService rolePermissionService,
    IHttpContextAccessor httpContextAccessor
    ) : AuthorizationHandler<HasPermissionRequirement>
{
    protected async override Task HandleRequirementAsync(AuthorizationHandlerContext context, HasPermissionRequirement requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return;

        var httpContext = httpContextAccessor.HttpContext;
        string? chatRoomId = httpContext?.GetRouteValue("id") as string;
        if (string.IsNullOrEmpty(chatRoomId))
        {
            chatRoomId = httpContext?.Request.Query["chatRoomId"].ToString();
            if (string.IsNullOrEmpty(chatRoomId))
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
}
