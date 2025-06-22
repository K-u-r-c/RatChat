using System.Net.Http.Headers;
using System.Text;
using Application.Account.DTOs;
using Application.Interfaces;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using static Application.Account.OAuth.GitHubInfo;
using static Application.Account.OAuth.GoogleInfo;

namespace API.Controllers;

public class AccountController(
    SignInManager<User> signInManager,
    IEmailSender<User> emailSender,
    IConfiguration configuration,
    IUserStatusService userStatusService
)
    : BaseApiController
{
    [AllowAnonymous]
    [HttpPost("github-login")]
    public async Task<ActionResult> LoginWithGitHub(string code)
    {
        if (string.IsNullOrEmpty(code)) return BadRequest("Missing authorization code");

        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Accept
            .Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var tokenResponse = await httpClient.PostAsJsonAsync(
            "https://github.com/login/oauth/access_token",
            new GitHubAuthRequest
            {
                Code = code,
                ClientId = configuration["Authentication:GitHub:ClientId"]!,
                ClientSecret = configuration["Authentication:GitHub:ClientSecret"]!,
                RedirectUri = $"{configuration["ClientAppUrl"]}/auth-callback"
            }
        );

        if (!tokenResponse.IsSuccessStatusCode)
            return BadRequest("Failed to get access token");

        var tokenContent =
            await tokenResponse.Content.ReadFromJsonAsync<GitHubTokenResponse>();

        if (string.IsNullOrEmpty(tokenContent?.AccessToken))
            return BadRequest("Failed to retrieve access token");

        httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", tokenContent.AccessToken);

        httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Reactivities");

        var userResponse =
            await httpClient.GetAsync("https://api.github.com/user");

        if (!userResponse.IsSuccessStatusCode)
            return BadRequest("Failed to fetch user from GitHub");

        var user = await userResponse.Content.ReadFromJsonAsync<GitHubUser>();

        if (user == null)
            return BadRequest("Failed to read user from GitHub");

        if (string.IsNullOrEmpty(user!.Email))
        {
            var emailResponse =
                await httpClient.GetAsync("https://api.github.com/user/emails");

            if (emailResponse.IsSuccessStatusCode)
            {
                var emails =
                    await emailResponse.Content.ReadFromJsonAsync<List<GitHubEmail>>();

                var primary =
                    emails?.FirstOrDefault(e => e is { Primary: true, Verified: true })?.Email;

                if (string.IsNullOrEmpty(primary))
                    return BadRequest("Failed to get email from github");

                user!.Email = primary;
            }
        }

        var existingUser = await signInManager.UserManager.FindByEmailAsync(user.Email);

        if (existingUser == null)
        {
            existingUser = new User
            {
                Email = user.Email,
                UserName = user.Email,
                DisplayName = user.Name,
                ImageUrl = user.ImageUrl
            };

            var createdResult = await signInManager.UserManager.CreateAsync(existingUser);

            if (!createdResult.Succeeded)
                return BadRequest("Failed to create user");
        }

        await signInManager.SignInAsync(existingUser, false);

        return Ok();
    }

    [AllowAnonymous]
    [HttpPost("google-login")]
    public async Task<ActionResult> LoginWithGoogle(string code)
    {
        if (string.IsNullOrEmpty(code)) return BadRequest("Missing authorization code");

        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Accept
            .Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var tokenRequest = new GoogleAuthRequest
        {
            Code = code,
            ClientId = configuration["Authentication:Google:ClientId"]!,
            ClientSecret = configuration["Authentication:Google:ClientSecret"]!,
            RedirectUri = $"{configuration["ClientAppUrl"]}/auth-callback?provider=google"
        };

        var tokenResponse = await httpClient.PostAsJsonAsync(
            "https://oauth2.googleapis.com/token",
            tokenRequest
        );

        if (!tokenResponse.IsSuccessStatusCode)
            return BadRequest("Failed to get access token from Google");

        var tokenContent = await tokenResponse.Content.ReadFromJsonAsync<GoogleTokenResponse>();

        if (string.IsNullOrEmpty(tokenContent?.AccessToken))
            return BadRequest("Failed to retrieve access token from Google");

        httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", tokenContent.AccessToken);

        var userResponse = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo");

        if (!userResponse.IsSuccessStatusCode)
            return BadRequest("Failed to fetch user from Google");

        var googleUser = await userResponse.Content.ReadFromJsonAsync<GoogleUser>();

        if (googleUser == null || string.IsNullOrEmpty(googleUser.Email))
            return BadRequest("Failed to read user from Google");

        if (!googleUser.VerifiedEmail)
            return BadRequest("Google account email is not verified");

        var existingUser = await signInManager.UserManager.FindByEmailAsync(googleUser.Email);

        if (existingUser == null)
        {
            existingUser = new User
            {
                Email = googleUser.Email,
                UserName = googleUser.Email,
                DisplayName = googleUser.Name,
                ImageUrl = googleUser.Picture
            };

            var createdResult = await signInManager.UserManager.CreateAsync(existingUser);

            if (!createdResult.Succeeded)
                return BadRequest("Failed to create user");
        }

        await signInManager.SignInAsync(existingUser, false);

        return Ok();
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult> RegisterUser(RegisterDto registerDto)
    {
        var user = new User
        {
            UserName = registerDto.Email,
            Email = registerDto.Email,
            DisplayName = registerDto.DisplayName
        };

        var result = await signInManager.UserManager.CreateAsync(user, registerDto.Password);

        if (result.Succeeded)
        {
            await SendConfirmationEmailAsync(user, registerDto.Email);
            return Ok();
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(error.Code, error.Description);
        }

        return ValidationProblem();
    }

    [AllowAnonymous]
    [HttpGet("resendConfirmEmail")]
    public async Task<ActionResult> ResendConfirmEmail(string? email, string? userId)
    {
        if (string.IsNullOrEmpty(email) && string.IsNullOrEmpty(userId))
            return BadRequest("Email or UserId must be provided");

        var user = await signInManager.UserManager.Users
            .FirstOrDefaultAsync(x => x.Email == email || x.Id == userId);

        if (user == null || string.IsNullOrEmpty(user.Email))
            return BadRequest("User not found");

        await SendConfirmationEmailAsync(user, user.Email);

        return Ok();
    }


    private async Task SendConfirmationEmailAsync(User user, string email)
    {
        var code = await signInManager.UserManager.GenerateEmailConfirmationTokenAsync(user);
        code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));

        var confirmEmailUrl = $"{configuration["ClientAppUrl"]}/confirm-email?userId={user.Id}&code={code}";

        await emailSender.SendConfirmationLinkAsync(user, email, confirmEmailUrl);
    }

    [AllowAnonymous]
    [HttpGet("user-info")]
    public async Task<ActionResult> GetUserInfo()
    {
        if (User.Identity?.IsAuthenticated == false) return NoContent();

        var user = await signInManager.UserManager.GetUserAsync(User);

        if (user == null) return Unauthorized();

        var hasPassword = await signInManager.UserManager.HasPasswordAsync(user);
        var actualStatus = await userStatusService.GetActualUserStatusAsync(user.Id);

        // If the status service reports offline, but this is an authenticated API call,
        // it's likely the user is online but the status hub hasn't connected yet.
        // We can be optimistic here, unless the user's status is set to Invisible.
        // In that case user will see the corrected status only after refetch of data.
        if (actualStatus == Domain.Enums.UserStatus.Offline && user.Status != Domain.Enums.UserStatus.Invisible)
        {
            actualStatus = Domain.Enums.UserStatus.Online;
        }

        return Ok(new
        {
            user.DisplayName,
            user.Email,
            user.Id,
            user.ImageUrl,
            user.BannerUrl,
            user.FriendCode,
            HasPassword = hasPassword,
            Status = actualStatus.ToString(),
            user.LastSeen
        });
    }

    [HttpPost("regenerate-friend-code")]
    public async Task<ActionResult> RegenerateFriendCode()
    {
        var user = await signInManager.UserManager.GetUserAsync(User);

        if (user == null) return Unauthorized();

        user.RegenerateFriendCode();
        var result = await signInManager.UserManager.UpdateAsync(user);

        if (result.Succeeded)
        {
            return Ok(new { FriendCode = user.FriendCode });
        }

        return BadRequest("Failed to regenerate friend code");
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        await signInManager.SignOutAsync();

        return NoContent();
    }

    [HttpPost("change-password")]
    public async Task<ActionResult> ChangePassword(ChangePasswordDto passwordDto)
    {
        var user = await signInManager.UserManager.GetUserAsync(User);

        if (user == null) return Unauthorized();

        var hasPassword = await signInManager.UserManager.HasPasswordAsync(user);

        if (!hasPassword)
        {
            return BadRequest("Password change is not available for users authenticated through external providers. Please manage your password through your authentication provider.");
        }

        var result = await signInManager.UserManager
            .ChangePasswordAsync(user, passwordDto.CurrentPassword, passwordDto.NewPassword);

        if (result.Succeeded) return Ok();

        return BadRequest(result.Errors.First().Description);
    }
}
