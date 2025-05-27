namespace Application.Core;

public class AppException(int statusCode, string meesage, string? details)
{
    public int StatusCode { get; set; } = statusCode;
    public string Meesage { get; set; } = meesage;
    public string? Details { get; set; } = details;
}
