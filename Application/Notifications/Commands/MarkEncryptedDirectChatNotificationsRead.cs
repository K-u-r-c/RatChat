using Application.Core;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Notifications.Commands;

public class MarkEncryptedDirectChatNotificationsRead
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string EncryptedDirectChatId { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            var notification = await context.EncryptedDirectChatNotifications
                .FirstOrDefaultAsync(
                    n => n.UserId == user.Id && n.EncryptedDirectChatId == request.EncryptedDirectChatId,
                    cancellationToken
                );

            if (notification is null)
            {
                return Result<Unit>.Success(Unit.Value);
            }

            if (notification.UnreadCount == 0)
            {
                return Result<Unit>.Success(Unit.Value);
            }

            notification.UnreadCount = 0;
            notification.UpdatedAt = DateTime.UtcNow;

            var success = await context.SaveChangesAsync(cancellationToken) > 0;
            return success
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Failed to update notifications", 500);
        }
    }
}
