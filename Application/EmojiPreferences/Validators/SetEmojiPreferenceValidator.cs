using Application.EmojiPreferences.Commands;
using FluentValidation;

namespace Application.EmojiPreferences.Validators;

public class SetEmojiPreferenceValidator : AbstractValidator<SetEmojiPreference.Command>
{
    public SetEmojiPreferenceValidator()
    {
        RuleFor(x => x.SetEmojiPreferenceDto.ChatType)
            .NotEmpty().WithMessage("Chat type is required")
            .Must(chatType => chatType == "ChatRoom" || chatType == "DirectChat")
            .WithMessage("Chat type must be either 'ChatRoom' or 'DirectChat'");

        RuleFor(x => x.SetEmojiPreferenceDto.ChatId)
            .NotEmpty().WithMessage("Chat ID is required")
            .Length(1, 50).WithMessage("Chat ID must be between 1 and 50 characters");

        RuleFor(x => x.SetEmojiPreferenceDto.DefaultEmoji)
            .NotEmpty().WithMessage("Default emoji is required")
            .Length(1, 10).WithMessage("Default emoji must be between 1 and 10 characters");
    }
}