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
    }

    private static bool BeValidStatus(string status)
    {
        return Enum.TryParse<UserStatus>(status, out _);
    }
}
