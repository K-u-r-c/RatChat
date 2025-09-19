using Application.Core;
using Application.Interfaces;
using Application.Notifications.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Notifications.Queries;

public class GetNotificationCounters
{
    public class Query : IRequest<Result<NotificationCountersDto>> { }

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Query, Result<NotificationCountersDto>>
    {
        public async Task<Result<NotificationCountersDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            var chatRoomCounters = await context.ChatRoomNotifications
                .Where(n => n.UserId == user.Id && n.UnreadCount > 0)
                .Select(n => new { n.ChatRoomId, n.UnreadCount })
                .ToListAsync(cancellationToken);

            var directChatCounters = await context.DirectChatNotifications
                .Where(n => n.UserId == user.Id && n.UnreadCount > 0)
                .Select(n => new { n.DirectChatId, n.UnreadCount })
                .ToListAsync(cancellationToken);

            var dto = new NotificationCountersDto
            {
                ChatRooms = chatRoomCounters.ToDictionary(x => x.ChatRoomId, x => x.UnreadCount),
                DirectChats = directChatCounters.ToDictionary(x => x.DirectChatId, x => x.UnreadCount),
            };

            return Result<NotificationCountersDto>.Success(dto);
        }
    }
}
