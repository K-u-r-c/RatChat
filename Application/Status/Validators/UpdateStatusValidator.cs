using Application.Status.Commands;
using Domain.Enums;
using FluentValidation;

namespace Application.Status.Validators;

public class UpdateStatusValidator : AbstractValidator<UpdateStatus.Command>
{
    public UpdateStatusValidator()
    {
        RuleFor(x => x.UpdateStatusDto.Status)
            .NotEmpty().WithMessage("Status is required")
            .Must(BeValidStatus).WithMessage("Invalid status value");

        RuleFor(x => x.UpdateStatusDto.CustomMessage)
            .MaximumLength(100).WithMessage("Custom message must not exceed 100 characters");
    }

    private static bool BeValidStatus(string status)
    {
        return Enum.TryParse<UserStatus>(status, out _);
    }
}
