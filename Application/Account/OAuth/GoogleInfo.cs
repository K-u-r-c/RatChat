using System.Text.Json.Serialization;

namespace Application.Account.OAuth;

public class GoogleInfo
{
    public class GoogleAuthRequest
    {
        public required string Code { get; set; }
        [JsonPropertyName("client_id")]
        public required string ClientId { get; set; }
        [JsonPropertyName("client_secret")]
        public required string ClientSecret { get; set; }
        [JsonPropertyName("redirect_uri")]
        public required string RedirectUri { get; set; }
        [JsonPropertyName("grant_type")]
        public string GrantType { get; set; } = "authorization_code";
    }

    public class GoogleTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = "";
        [JsonPropertyName("token_type")]
        public string TokenType { get; set; } = "";
        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }
        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; }
    }

    public class GoogleUser
    {
        public string Id { get; set; } = "";
        public string Email { get; set; } = "";
        public string Name { get; set; } = "";
        [JsonPropertyName("given_name")]
        public string GivenName { get; set; } = "";
        [JsonPropertyName("family_name")]
        public string FamilyName { get; set; } = "";
        public string Picture { get; set; } = "";
        [JsonPropertyName("verified_email")]
        public bool VerifiedEmail { get; set; }
    }
}