using Application.Core;
using Application.Interfaces;
using Application.Status.DTOs;
using MediatR;

namespace Application.Status.Queries;

public class GetOnlineUsers
{
    public class Query : IRequest<Result<OnlineUsersDto>>
    {
        public required List<string> UserIds { get; set; }
    }

    public class Handler(IUserStatusService userStatusService) : IRequestHandler<Query, Result<OnlineUsersDto>>
    {
        public async Task<Result<OnlineUsersDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var onlineUsers = await userStatusService.GetOnlineUsersAsync(request.UserIds);

            return Result<OnlineUsersDto>.Success(new OnlineUsersDto
            {
                UserIds = onlineUsers
            });
        }
    }
}