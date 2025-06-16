using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Infrastructure.Security;

public class IsAdminRequirement : IAuthorizationRequirement { }

public class IsAdminRequirementHandler(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    : AuthorizationHandler<IsAdminRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, IsAdminRequirement requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return;

        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext?.GetRouteValue("id") is not string chatRoomId) return;

        var member = await dbContext.ChatRoomMembers
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.UserId == userId && x.ChatRoomId == chatRoomId);

        if (member == null) return;

        if (member.IsOwner) context.Succeed(requirement);
    }
}