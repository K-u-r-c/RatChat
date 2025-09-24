using Application.ChatAppearances.Commands;
using FluentValidation;

namespace Application.ChatAppearances.Validators;

public class SetChatAppearanceValidator : AbstractValidator<SetChatAppearance.Command>
{
    public SetChatAppearanceValidator()
    {
        RuleFor(x => x.SetChatAppearanceDto.ChatId)
            .NotEmpty().WithMessage("Chat ID is required")
            .Length(1, 50).WithMessage("Chat ID must be between 1 and 50 characters");

        RuleFor(x => x.SetChatAppearanceDto.ChatType)
            .NotEmpty().WithMessage("Chat type is required")
            .Length(1, 20).WithMessage("Chat type must be between 1 and 20 characters");

        RuleFor(x => x.SetChatAppearanceDto)
            .Must(dto =>
                !string.IsNullOrWhiteSpace(dto.BackgroundKey) ||
                !string.IsNullOrWhiteSpace(dto.DefaultEmoji))
            .WithMessage("At least one appearance property must be provided");

        RuleFor(x => x.SetChatAppearanceDto.DefaultEmoji)
            .MaximumLength(10)
            .When(x => !string.IsNullOrWhiteSpace(x.SetChatAppearanceDto.DefaultEmoji))
            .WithMessage("Default emoji must be 10 characters or fewer");

        RuleFor(x => x.SetChatAppearanceDto.BackgroundKey)
            .MaximumLength(50)
            .When(x => !string.IsNullOrWhiteSpace(x.SetChatAppearanceDto.BackgroundKey))
            .WithMessage("Background key must be 50 characters or fewer");
    }
}
