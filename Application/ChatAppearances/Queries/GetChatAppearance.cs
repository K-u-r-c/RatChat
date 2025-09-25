using Application.ChatAppearances.DTOs;
using Application.Core;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.ChatAppearances.Queries;

public class GetChatAppearance
{
    public class Query : IRequest<Result<ChatAppearanceDto?>>
    {
        public required string ChatType { get; set; }
        public required string ChatId { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor, IMapper mapper)
        : IRequestHandler<Query, Result<ChatAppearanceDto?>>
    {
        public async Task<Result<ChatAppearanceDto?>> Handle(Query request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            var hasAccess = await HasAccessAsync(context, request.ChatType, request.ChatId, user.Id, cancellationToken);
            if (!hasAccess)
            {
                return Result<ChatAppearanceDto?>.Failure("User does not have access to this chat", 403);
            }

            var appearance = await context.ChatAppearances
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    ca => ca.ChatType == request.ChatType && ca.ChatId == request.ChatId,
                    cancellationToken);

            if (appearance == null)
            {
                return Result<ChatAppearanceDto?>.Success(new ChatAppearanceDto
                {
                    Id = string.Empty,
                    ChatType = request.ChatType,
                    ChatId = request.ChatId,
                    DefaultEmoji = "\uD83D\uDC4D",
                    BackgroundKey = "default",
                    UpdatedByUserId = null,
                    UpdatedAt = DateTime.UtcNow,
                });
            }

            return Result<ChatAppearanceDto?>.Success(mapper.Map<ChatAppearanceDto>(appearance));
        }

        private static async Task<bool> HasAccessAsync(
            AppDbContext context,
            string chatType,
            string chatId,
            string userId,
            CancellationToken cancellationToken)
        {
            return chatType switch
            {
                "ChatRoom" => await context.ChatRoomMembers.AnyAsync(
                    m => m.ChatRoomId == chatId && m.UserId == userId,
                    cancellationToken),
                "DirectChat" => await context.DirectChats.AnyAsync(
                    dc => dc.Id == chatId && (dc.User1Id == userId || dc.User2Id == userId),
                    cancellationToken),
                "EncryptedDirectChat" => await context.EncryptedDirectChats.AnyAsync(
                    edc => edc.Id == chatId && (edc.User1Id == userId || edc.User2Id == userId),
                    cancellationToken),
                _ => false,
            };
        }
    }
}
