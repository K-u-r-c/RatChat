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
                !string.IsNullOrWhiteSpace(dto.BackgroundCustomUrl) ||
                !string.IsNullOrWhiteSpace(dto.BackgroundCustomPublicId) ||
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

        RuleFor(x => x.SetChatAppearanceDto.BackgroundCustomUrl)
            .MaximumLength(500)
            .When(x => !string.IsNullOrWhiteSpace(x.SetChatAppearanceDto.BackgroundCustomUrl))
            .WithMessage("Custom background URL must be 500 characters or fewer");

        RuleFor(x => x.SetChatAppearanceDto.BackgroundCustomPublicId)
            .MaximumLength(200)
            .When(x => !string.IsNullOrWhiteSpace(x.SetChatAppearanceDto.BackgroundCustomPublicId))
            .WithMessage("Custom background reference must be 200 characters or fewer");

        RuleFor(x => x.SetChatAppearanceDto)
            .Custom((dto, context) =>
            {
                if (string.Equals(dto.BackgroundKey?.Trim(), "custom", System.StringComparison.OrdinalIgnoreCase))
                {
                    if (string.IsNullOrWhiteSpace(dto.BackgroundCustomUrl) ||
                        string.IsNullOrWhiteSpace(dto.BackgroundCustomPublicId))
                    {
                        context.AddFailure("BackgroundCustomUrl", "Custom background requires an uploaded image.");
                    }
                }
            });
    }
}
