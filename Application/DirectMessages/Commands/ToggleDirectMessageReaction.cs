using Application.Core;
using Application.Interfaces;
using Application.Messages.DTOs;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.DirectMessages.Commands;

public class ToggleDirectMessageReaction
{
    public class Command : IRequest<Result<ReactionUpdateDto>>
    {
        public required string DirectChatId { get; set; }
        public required string DirectMessageId { get; set; }
        public required string Emoji { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor)
        : IRequestHandler<Command, Result<ReactionUpdateDto>>
    {
        private static string BuildEmojiKey(string emoji)
        {
            if (string.IsNullOrEmpty(emoji)) return string.Empty;
            var cps = new List<int>();
            for (int i = 0; i < emoji.Length; i++)
            {
                int code = char.ConvertToUtf32(emoji, i);
                if (char.IsHighSurrogate(emoji[i])) i++;
                if (code == 0xFE0F) continue; // ignore VS16
                cps.Add(code);
            }
            return string.Join("-", cps.Select(c => c.ToString("X")));
        }

        public async Task<Result<ReactionUpdateDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();

            // validate access
            var chat = await context.DirectChats.AsNoTracking()
                .FirstOrDefaultAsync(dc => dc.Id == request.DirectChatId, cancellationToken);
            if (chat == null) return Result<ReactionUpdateDto>.Failure("Chat not found", 404);
            if (chat.User1Id != user.Id && chat.User2Id != user.Id)
                return Result<ReactionUpdateDto>.Failure("Access denied", 403);

            var message = await context.DirectMessages
                .Include(m => m.Sender)
                .FirstOrDefaultAsync(m => m.Id == request.DirectMessageId && m.DirectChatId == request.DirectChatId, cancellationToken);
            if (message == null)
                return Result<ReactionUpdateDto>.Failure("Message not found", 404);

            var normalizedEmoji = request.Emoji.Trim();
            if (string.IsNullOrEmpty(normalizedEmoji))
                return Result<ReactionUpdateDto>.Failure("Invalid emoji", 400);
            var emojiKey = BuildEmojiKey(normalizedEmoji);
            if (string.IsNullOrEmpty(emojiKey))
                return Result<ReactionUpdateDto>.Failure("Invalid emoji", 400);

            var existing = await context.DirectMessageReactions.FirstOrDefaultAsync(r =>
                r.DirectMessageId == request.DirectMessageId && r.UserId == user.Id &&
                (r.EmojiKey == emojiKey || (r.EmojiKey == "" && r.Emoji == normalizedEmoji)), cancellationToken);

            if (existing != null)
            {
                if (string.IsNullOrEmpty(existing.EmojiKey)) existing.EmojiKey = emojiKey;
                context.DirectMessageReactions.Remove(existing);
                await context.SaveChangesAsync(cancellationToken);

                return Result<ReactionUpdateDto>.Success(new ReactionUpdateDto
                {
                    Action = "removed",
                    ChatRoomId = request.DirectChatId,
                    MessageId = request.DirectMessageId,
                    Emoji = normalizedEmoji,
                    UserId = user.Id,
                    DisplayName = user.DisplayName ?? "Unknown",
                    CreatedAt = existing.CreatedAt
                });
            }
            else
            {
                var reaction = new DirectMessageReaction
                {
                    DirectMessageId = request.DirectMessageId,
                    UserId = user.Id,
                    Emoji = normalizedEmoji,
                    EmojiKey = emojiKey
                };
                context.DirectMessageReactions.Add(reaction);
                await context.SaveChangesAsync(cancellationToken);

                return Result<ReactionUpdateDto>.Success(new ReactionUpdateDto
                {
                    Action = "added",
                    ChatRoomId = request.DirectChatId,
                    MessageId = request.DirectMessageId,
                    Emoji = normalizedEmoji,
                    UserId = user.Id,
                    DisplayName = user.DisplayName ?? "Unknown",
                    CreatedAt = reaction.CreatedAt
                });
            }
        }
    }
}

