namespace API.DTOs;

public class LinkPreviewResponse
{
    public required string Url { get; init; }
    public string? Title { get; init; }
    public string? Description { get; init; }
    public string? SiteName { get; init; }
    public string? ImageUrl { get; init; }
    public string? FaviconUrl { get; init; }
    public string? ProviderName { get; init; }
    public string? AuthorName { get; init; }
    public string? MediaType { get; init; }
    public string? EmbedHtml { get; init; }
    public string? EmbedUrl { get; init; }
    public string? EmbedType { get; init; }
    public int? Width { get; init; }
    public int? Height { get; init; }
}
