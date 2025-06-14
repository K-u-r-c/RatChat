using Application.Friends.Commands;
using FluentValidation;

namespace Application.Friends.Validators;

public class SendFriendRequestValidator : AbstractValidator<SendFriendRequest.Command>
{
    public SendFriendRequestValidator()
    {
        RuleFor(x => x.SendFriendRequestDto.FriendCode)
            .NotEmpty().WithMessage("Friend code is required")
            .Length(6, 8).WithMessage("Friend code must be 6-8 characters long")
            .Matches("^[A-Z0-9]+$").WithMessage("Friend code can only contain uppercase letters and numbers");

        RuleFor(x => x.SendFriendRequestDto.Message)
            .MaximumLength(200).WithMessage("Message must not exceed 200 characters");
    }
}