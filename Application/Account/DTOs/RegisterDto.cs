using System.ComponentModel.DataAnnotations;

namespace Application.Account.DTOs;

public class RegisterDto
{
    [Required]
    public string DisplayName { get; set; } = "";

    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    // Identity is going to enforce password complexity anyway
    public string Password { get; set; } = "";
}
