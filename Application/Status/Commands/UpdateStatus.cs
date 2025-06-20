using Application.Core;
using Application.Interfaces;
using Application.Status.DTOs;
using Domain.Enums;
using MediatR;
using Persistance;

namespace Application.Status.Commands;

public class UpdateStatus
{
    public class Command : IRequest<Result<Unit>>
    {
        public required UpdateStatusDto UpdateStatusDto { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IUserAccessor userAccessor,
        IStatusNotificationService statusNotificationService)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            if (!Enum.TryParse<UserStatus>(request.UpdateStatusDto.Status, out var status))
                return Result<Unit>.Failure("Invalid status", 400);

            var previousStatus = user.Status;
            var previousMessage = user.CustomStatusMessage;

            user.Status = status;
            user.CustomStatusMessage = request.UpdateStatusDto.CustomMessage;
            user.LastSeen = DateTime.UtcNow;

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result)
                return Result<Unit>.Failure("Failed to update status", 400);

            if (previousStatus != status || previousMessage != request.UpdateStatusDto.CustomMessage)
            {
                await statusNotificationService.NotifyFriendsStatusChange(
                    user.Id,
                    status,
                    request.UpdateStatusDto.CustomMessage);
            }

            return Result<Unit>.Success(Unit.Value);
        }
    }
}