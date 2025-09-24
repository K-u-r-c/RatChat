using Application.ChatAppearances.DTOs;
using Application.Core;
using Application.Interfaces;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.ChatAppearances.Commands;

public class SetChatAppearance
{
    public class Command : IRequest<Result<ChatAppearanceDto>>
    {
        public required SetChatAppearanceDto SetChatAppearanceDto { get; set; }
    }

    public class Handler(
        AppDbContext context,
        IUserAccessor userAccessor,
        IMapper mapper,
        IChatAppearanceNotificationService notificationService
    ) : IRequestHandler<Command, Result<ChatAppearanceDto>>
    {
        public async Task<Result<ChatAppearanceDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();
            var dto = request.SetChatAppearanceDto;

            var hasAccess = await HasAccessAsync(context, dto.ChatType, dto.ChatId, user.Id, cancellationToken);
            if (!hasAccess)
            {
                return Result<ChatAppearanceDto>.Failure("User does not have access to this chat", 403);
            }

            var canManage = await CanManageAsync(context, dto.ChatType, dto.ChatId, user.Id, cancellationToken);
            if (!canManage)
            {
                return Result<ChatAppearanceDto>.Failure("User cannot manage appearance for this chat", 403);
            }

            var appearance = await context.ChatAppearances.FirstOrDefaultAsync(
                ca => ca.ChatType == dto.ChatType && ca.ChatId == dto.ChatId,
                cancellationToken);

            var isNew = appearance == null;
            appearance ??= new ChatAppearance
            {
                ChatType = dto.ChatType,
                ChatId = dto.ChatId,
            };

            var changed = false;

            if (!string.IsNullOrWhiteSpace(dto.DefaultEmoji) &&
                dto.DefaultEmoji != appearance.DefaultEmoji)
            {
                appearance.DefaultEmoji = dto.DefaultEmoji;
                changed = true;
            }

            if (!string.IsNullOrWhiteSpace(dto.BackgroundKey) &&
                dto.BackgroundKey != appearance.BackgroundKey)
            {
                appearance.BackgroundKey = dto.BackgroundKey;
                changed = true;
            }

            if (!changed)
            {
                return Result<ChatAppearanceDto>.Success(mapper.Map<ChatAppearanceDto>(appearance));
            }

            appearance.UpdatedByUserId = user.Id;
            appearance.UpdatedAt = DateTime.UtcNow;

            if (isNew)
            {
                context.ChatAppearances.Add(appearance);
            }

            var saveResult = await context.SaveChangesAsync(cancellationToken) > 0;
            if (!saveResult)
            {
                return Result<ChatAppearanceDto>.Failure("Failed to save chat appearance", 400);
            }

            var mapped = mapper.Map<ChatAppearanceDto>(appearance);
            var participantIds = await GetParticipantIdsAsync(context, dto.ChatType, dto.ChatId, cancellationToken);

            await notificationService.NotifyAppearanceChanged(dto.ChatType, dto.ChatId, mapped, participantIds);

            return Result<ChatAppearanceDto>.Success(mapped);
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

        private static async Task<bool> CanManageAsync(
            AppDbContext context,
            string chatType,
            string chatId,
            string userId,
            CancellationToken cancellationToken)
        {
            return chatType switch
            {
                "ChatRoom" => await context.ChatRooms
                    .AnyAsync(cr => cr.Id == chatId && cr.OwnerId == userId, cancellationToken),
                "DirectChat" => await context.DirectChats
                    .AnyAsync(dc => dc.Id == chatId && (dc.User1Id == userId || dc.User2Id == userId), cancellationToken),
                "EncryptedDirectChat" => await context.EncryptedDirectChats
                    .AnyAsync(edc => edc.Id == chatId && (edc.User1Id == userId || edc.User2Id == userId), cancellationToken),
                _ => false,
            };
        }

        private static async Task<List<string>> GetParticipantIdsAsync(
            AppDbContext context,
            string chatType,
            string chatId,
            CancellationToken cancellationToken)
        {
            if (chatType == "ChatRoom")
            {
                return await context.ChatRoomMembers
                    .AsNoTracking()
                    .Where(m => m.ChatRoomId == chatId && m.UserId != null)
                    .Select(m => m.UserId!)
                    .ToListAsync(cancellationToken);
            }

            if (chatType == "DirectChat")
            {
                var chat = await context.DirectChats
                    .AsNoTracking()
                    .Where(dc => dc.Id == chatId)
                    .Select(dc => new { dc.User1Id, dc.User2Id })
                    .FirstOrDefaultAsync(cancellationToken);

                return chat == null
                    ? []
                    : [chat.User1Id, chat.User2Id];
            }

            if (chatType == "EncryptedDirectChat")
            {
                var chat = await context.EncryptedDirectChats
                    .AsNoTracking()
                    .Where(dc => dc.Id == chatId)
                    .Select(dc => new { dc.User1Id, dc.User2Id })
                    .FirstOrDefaultAsync(cancellationToken);

                return chat == null
                    ? []
                    : [chat.User1Id, chat.User2Id];
            }

            return [];
        }
    }
}
