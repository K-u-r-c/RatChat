using Application.Core;
using Application.Friends.DTOs;
using Application.Interfaces;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Friends.Queries;

public class GetFriendRequests
{
    public class Query : IRequest<Result<FriendRequestsResponse>> { }

    public class FriendRequestsResponse
    {
        public List<FriendRequestDto> Sent { get; set; } = [];
        public List<FriendRequestDto> Received { get; set; } = [];
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Query, Result<FriendRequestsResponse>>
    {
        public async Task<Result<FriendRequestsResponse>> Handle(Query request, CancellationToken cancellationToken)
        {
            var currentUser = await userAccessor.GetUserAsync();

            var sentRequests = await context.FriendRequests
                .Where(fr => fr.SenderId == currentUser.Id && fr.Status == FriendRequestStatus.Pending)
                .Include(fr => fr.Receiver)
                .Select(fr => new FriendRequestDto
                {
                    Id = fr.Id,
                    SenderId = fr.SenderId,
                    SenderDisplayName = fr.Sender.DisplayName ?? "",
                    SenderImageUrl = fr.Sender.ImageUrl,
                    ReceiverId = fr.ReceiverId,
                    ReceiverDisplayName = fr.Receiver.DisplayName ?? "",
                    ReceiverImageUrl = fr.Receiver.ImageUrl,
                    Status = fr.Status.ToString(),
                    CreatedAt = fr.CreatedAt,
                    RespondedAt = fr.RespondedAt,
                    Message = fr.Message
                })
                .OrderByDescending(fr => fr.CreatedAt)
                .ToListAsync(cancellationToken);

            var receivedRequests = await context.FriendRequests
                .Where(fr => fr.ReceiverId == currentUser.Id && fr.Status == FriendRequestStatus.Pending)
                .Include(fr => fr.Sender)
                .Select(fr => new FriendRequestDto
                {
                    Id = fr.Id,
                    SenderId = fr.SenderId,
                    SenderDisplayName = fr.Sender.DisplayName ?? "",
                    SenderImageUrl = fr.Sender.ImageUrl,
                    ReceiverId = fr.ReceiverId,
                    ReceiverDisplayName = fr.Receiver.DisplayName ?? "",
                    ReceiverImageUrl = fr.Receiver.ImageUrl,
                    Status = fr.Status.ToString(),
                    CreatedAt = fr.CreatedAt,
                    RespondedAt = fr.RespondedAt,
                    Message = fr.Message
                })
                .OrderByDescending(fr => fr.CreatedAt)
                .ToListAsync(cancellationToken);

            return Result<FriendRequestsResponse>.Success(new FriendRequestsResponse
            {
                Sent = sentRequests,
                Received = receivedRequests
            });
        }
    }
}