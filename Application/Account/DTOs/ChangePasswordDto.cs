using System.ComponentModel.DataAnnotations;

namespace Application.Account.DTOs;

public class ChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = "";
    [Required]
    public string NewPassword { get; set; } = "";
}