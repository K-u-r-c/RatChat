using Application.Core;
using Application.Interfaces;
using Application.Status.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Status.Queries;

public class GetUserStatus
{
    public class Query : IRequest<Result<UserStatusDto>>
    {
        public required string UserId { get; set; }
    }

    public class Handler(AppDbContext context, IUserStatusService userStatusService)
        : IRequestHandler<Query, Result<UserStatusDto>>
    {
        public async Task<Result<UserStatusDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var user = await context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

            if (user == null)
                return Result<UserStatusDto>.Failure("User not found", 404);

            var isOnline = await userStatusService.IsUserOnlineAsync(request.UserId);
            var actualStatus = await userStatusService.GetActualUserStatusAsync(request.UserId);

            var statusDto = new UserStatusDto
            {
                UserId = user.Id,
                Status = actualStatus.ToString(),
                CustomMessage = user.CustomStatusMessage,
                LastSeen = user.LastSeen,
                IsOnline = isOnline
            };

            return Result<UserStatusDto>.Success(statusDto);
        }
    }
}