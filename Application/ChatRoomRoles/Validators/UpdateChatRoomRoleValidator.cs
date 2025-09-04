using Application.ChatRoomRoles.Commands;
using FluentValidation;

namespace Application.ChatRoomRoles.Validators;

public class UpdateChatRoomRoleValidator :
    AbstractValidator<UpdateChatRoomRole.Command>
{
    public UpdateChatRoomRoleValidator()
    {
        RuleFor(x => x.UpdateChatRoomRoleDto.Id)
            .NotEmpty().WithMessage("Role ID is required.");

        RuleFor(x => x.UpdateChatRoomRoleDto.Name)
            .MaximumLength(50).WithMessage("Role name must not exceed 50 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.UpdateChatRoomRoleDto.Name));

        RuleFor(x => x.UpdateChatRoomRoleDto.Description)
            .MaximumLength(200).WithMessage("Description must not exceed 200 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.UpdateChatRoomRoleDto.Description));

        RuleFor(x => x.UpdateChatRoomRoleDto.Color)
            .Matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
            .WithMessage("Color must be a valid hex code (e.g., #FFF or #FFFFFF)")
            .When(x => !string.IsNullOrWhiteSpace(x.UpdateChatRoomRoleDto.Color));
    }
}
