using Application.Profiles.Commands;
using FluentValidation;

namespace Application.Profiles.Validators;

public class UpdateProfileValidator : AbstractValidator<UpdateProfile.Command>
{
    public UpdateProfileValidator()
    {
        RuleFor(x => x.UpdateProfileDto.DisplayName)
            .NotEmpty().WithMessage("Display name is required")
            .MaximumLength(50).WithMessage("Display name must not exceed 50 characters");

        RuleFor(x => x.UpdateProfileDto.Bio)
            .MaximumLength(500).WithMessage("Bio must not exceed 500 characters");
    }
}