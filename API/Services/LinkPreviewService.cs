using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using API.DTOs;
using Microsoft.Extensions.Caching.Memory;

namespace API.Services;

public interface ILinkPreviewService
{
    Task<LinkPreviewResponse?> FetchAsync(string url, CancellationToken cancellationToken = default);
}

public sealed class LinkPreviewService : ILinkPreviewService
{
    private const int MaxDocumentChars = 256 * 1024;
    private const string CacheVersion = "v3";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);

    private static readonly Regex MetaTagRegex =
        new("<meta\\s+[^>]*>", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex LinkTagRegex =
        new("<link\\s+[^>]*>", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex TitleTagRegex =
        new("<title[^>]*>(?<title>.*?)</title>", RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.Singleline);
    private static readonly Regex AttributeRegex =
        new("(?<name>[a-zA-Z0-9_:\\-]+)\\s*=\\s*(\"(?<value>[^\"]*)\"|'(?<value>[^']*)'|(?<value>[^\\s\"'>]+))",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex IframeSrcRegex =
        new("<iframe[^>]*src\\s*=\\s*(?:\\\"(?<src>[^\\\"]+)\\\"|'(?<src>[^']+)'|(?<src>[^\\s>]+))",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex YouTubeTimestampRegex =
        new("^(?:(?<hours>\\d+)h)?(?:(?<minutes>\\d+)m)?(?:(?<seconds>\\d+)s)?$",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly string[] TrustedEmbedHosts =
    {
        "youtube.com",
        "youtu.be",
        "youtube-nocookie.com",
        "vimeo.com",
        "player.vimeo.com",
        "instagram.com",
        "cdninstagram.com",
        "tiktok.com",
        "musical.ly",
        "facebook.com",
        "fbcdn.net",
        "twitter.com",
        "x.com",
        "twimg.com",
    };

    private static readonly string[] VideoFileExtensions =
    {
        "mp4",
        "webm",
        "mov",
        "m3u8",
    };

    private static readonly CacheEntry EmptyCacheEntry = new(false, null);

    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<LinkPreviewService> _logger;
    private readonly MemoryCacheEntryOptions _cacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = CacheDuration,
    };

    private sealed record CacheEntry(bool HasValue, LinkPreviewResponse? Value);

    private sealed record OEmbedPayload(
        string? Title,
        string? AuthorName,
        string? ProviderName,
        string? Type,
        string? ThumbnailUrl,
        string? Html,
        int? Width,
        int? Height);

    private sealed record EmbedInfo(string Url, string Type, int? Width, int? Height);

    public LinkPreviewService(HttpClient httpClient, IMemoryCache cache, ILogger<LinkPreviewService> logger)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;

        if (!_httpClient.DefaultRequestHeaders.UserAgent.Any())
        {
            _httpClient.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("RatChatLinkPreview", "1.0"));
            _httpClient.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("(+https://ratchat.app)"));
        }
    }

    public async Task<LinkPreviewResponse?> FetchAsync(string url, CancellationToken cancellationToken = default)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException("Only absolute HTTP/HTTPS URLs are supported", nameof(url));
        }

        if (!string.IsNullOrEmpty(uri.Fragment))
        {
            var builder = new UriBuilder(uri) { Fragment = string.Empty };
            uri = builder.Uri;
        }

        var cacheKey = $"link-preview::{uri}";
        if (_cache.TryGetValue(cacheKey, out CacheEntry? cached) && cached is not null)
        {
            return cached.HasValue ? cached.Value : null;
        }

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, uri);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/html"));
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/xhtml+xml"));
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/xml", 0.9));

            using var response = await _httpClient.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            if (!response.IsSuccessStatusCode || response.Content is null)
            {
                _cache.Set(cacheKey, EmptyCacheEntry, _cacheOptions);
                return null;
            }

            var mediaType = response.Content.Headers.ContentType?.MediaType;
            if (mediaType is not null && !mediaType.Contains("html", StringComparison.OrdinalIgnoreCase))
            {
                _cache.Set(cacheKey, EmptyCacheEntry, _cacheOptions);
                return null;
            }

            var html = await ReadContentAsync(response.Content, cancellationToken);
            if (string.IsNullOrWhiteSpace(html))
            {
                _cache.Set(cacheKey, EmptyCacheEntry, _cacheOptions);
                return null;
            }

            var preview = await BuildPreviewAsync(uri, html, cancellationToken);
            if (preview is null)
            {
                _cache.Set(cacheKey, EmptyCacheEntry, _cacheOptions);
                return null;
            }

            _cache.Set(cacheKey, new CacheEntry(true, preview), _cacheOptions);
            return preview;
        }
        catch (TaskCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to build link preview for {Url}", uri);
            _cache.Set(cacheKey, EmptyCacheEntry, _cacheOptions);
            return null;
        }
    }

    private async Task<LinkPreviewResponse?> BuildPreviewAsync(
        Uri baseUri,
        string html,
        CancellationToken cancellationToken)
    {
        var meta = ExtractMeta(html);

        var title = FirstNonEmpty(
            meta.GetValueOrDefault("og:title"),
            meta.GetValueOrDefault("twitter:title"),
            ExtractTitle(html));

        var description = FirstNonEmpty(
            meta.GetValueOrDefault("og:description"),
            meta.GetValueOrDefault("description"),
            meta.GetValueOrDefault("twitter:description"));

        var siteName = FirstNonEmpty(
            meta.GetValueOrDefault("og:site_name"),
            TryGetHost(baseUri));

        var imageUrl = FirstNonEmpty(
            ResolveUrl(baseUri, meta.GetValueOrDefault("og:image")),
            ResolveUrl(baseUri, meta.GetValueOrDefault("og:image:secure_url")),
            ResolveUrl(baseUri, meta.GetValueOrDefault("twitter:image")));

        var faviconUrl = ExtractFavicon(html, baseUri);
        var mediaType = FirstNonEmpty(
            meta.GetValueOrDefault("og:type"),
            meta.GetValueOrDefault("twitter:card"));
        var providerName = FirstNonEmpty(
            meta.GetValueOrDefault("og:site_name"),
            meta.GetValueOrDefault("twitter:site"));
        var authorName = FirstNonEmpty(
            meta.GetValueOrDefault("article:author"),
            meta.GetValueOrDefault("author"));

        OEmbedPayload? oEmbed = null;
        var oEmbedUrl = ExtractOEmbedUrl(html);
        if (oEmbedUrl is not null)
        {
            oEmbed = await FetchOEmbedAsync(baseUri, oEmbedUrl, cancellationToken);
            if (oEmbed is not null)
            {
                title ??= oEmbed.Title;
                providerName ??= oEmbed.ProviderName;
                authorName ??= oEmbed.AuthorName;
                mediaType ??= oEmbed.Type;
                imageUrl ??= ResolveUrl(baseUri, oEmbed.ThumbnailUrl);
            }
        }

        var embedInfo = DetermineEmbed(baseUri, meta, oEmbed) ?? BuildKnownEmbed(baseUri, meta);
        var width = embedInfo?.Width
            ?? oEmbed?.Width
            ?? ParseInt(meta.GetValueOrDefault("og:video:width"));
        var height = embedInfo?.Height
            ?? oEmbed?.Height
            ?? ParseInt(meta.GetValueOrDefault("og:video:height"));

        if (string.IsNullOrWhiteSpace(mediaType) && embedInfo is not null)
        {
            mediaType = embedInfo.Type;
        }

        if (string.IsNullOrWhiteSpace(title) &&
            string.IsNullOrWhiteSpace(description) &&
            string.IsNullOrWhiteSpace(imageUrl))
        {
            return null;
        }

        return new LinkPreviewResponse
        {
            Url = baseUri.ToString(),
            Title = title,
            Description = description,
            SiteName = siteName,
            ImageUrl = imageUrl,
            FaviconUrl = faviconUrl,
            ProviderName = providerName,
            AuthorName = authorName,
            MediaType = mediaType,
            EmbedUrl = embedInfo?.Url,
            EmbedType = embedInfo?.Type,
            Width = width,
            Height = height,
        };
    }

    private static Dictionary<string, string> ExtractMeta(string html)
    {
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (Match match in MetaTagRegex.Matches(html))
        {
            var attributes = ParseAttributes(match.Value);
            if (attributes.TryGetValue("content", out var content) && !string.IsNullOrWhiteSpace(content))
            {
                if (attributes.TryGetValue("property", out var property))
                {
                    dict[property] = content.Trim();
                }
                else if (attributes.TryGetValue("name", out var name))
                {
                    dict[name] = content.Trim();
                }
            }
        }
        return dict;
    }

    private static string? ExtractTitle(string html)
    {
        var match = TitleTagRegex.Match(html);
        if (!match.Success) return null;
        var raw = match.Groups["title"].Value;
        return string.IsNullOrWhiteSpace(raw) ? null : WebUtility.HtmlDecode(raw.Trim());
    }

    private static string? ExtractFavicon(string html, Uri baseUri)
    {
        foreach (Match match in LinkTagRegex.Matches(html))
        {
            var attributes = ParseAttributes(match.Value);
            if (!attributes.TryGetValue("rel", out var relValue)) continue;
            if (!attributes.TryGetValue("href", out var href)) continue;

            var relTokens = relValue.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (relTokens.Any(r => r.Equals("icon", StringComparison.OrdinalIgnoreCase) ||
                                   r.Equals("shortcut", StringComparison.OrdinalIgnoreCase)))
            {
                var resolved = ResolveUrl(baseUri, href);
                if (resolved is not null) return resolved;
            }
        }

        return ResolveUrl(baseUri, "/favicon.ico");
    }

    private static string? ExtractOEmbedUrl(string html)
    {
        foreach (Match match in LinkTagRegex.Matches(html))
        {
            var attributes = ParseAttributes(match.Value);
            if (!attributes.TryGetValue("type", out var type)) continue;
            if (!attributes.TryGetValue("href", out var href)) continue;

            if (type.Equals("application/json+oembed", StringComparison.OrdinalIgnoreCase))
            {
                return href;
            }
        }
        return null;
    }

    private async Task<OEmbedPayload?> FetchOEmbedAsync(
        Uri baseUri,
        string href,
        CancellationToken cancellationToken)
    {
        var target = ResolveUrl(baseUri, href);
        if (target is null) return null;

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, target);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            using var response = await _httpClient.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            if (!response.IsSuccessStatusCode || response.Content is null)
            {
                return null;
            }

            var contentType = response.Content.Headers.ContentType?.MediaType;
            if (contentType is null || !contentType.Contains("json", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var root = document.RootElement;

            return new OEmbedPayload(
                Title: root.TryGetProperty("title", out var titleEl) ? titleEl.GetString() : null,
                AuthorName: root.TryGetProperty("author_name", out var authorEl) ? authorEl.GetString() : null,
                ProviderName: root.TryGetProperty("provider_name", out var providerEl) ? providerEl.GetString() : null,
                Type: root.TryGetProperty("type", out var typeEl) ? typeEl.GetString() : null,
                ThumbnailUrl: root.TryGetProperty("thumbnail_url", out var thumbEl) ? thumbEl.GetString() : null,
                Html: root.TryGetProperty("html", out var htmlEl) ? htmlEl.GetString() : null,
                Width: root.TryGetProperty("width", out var widthEl) && widthEl.TryGetInt32(out var width)
                    ? width
                    : null,
                Height: root.TryGetProperty("height", out var heightEl) && heightEl.TryGetInt32(out var height)
                    ? height
                    : null);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to fetch oEmbed payload from {Url}", target);
            return null;
        }
    }

    private static EmbedInfo? DetermineEmbed(
        Uri baseUri,
        Dictionary<string, string> meta,
        OEmbedPayload? oEmbed)
    {
        var ogVideo = FirstNonEmpty(
            meta.GetValueOrDefault("og:video:url"),
            meta.GetValueOrDefault("og:video:secure_url"),
            meta.GetValueOrDefault("og:video"),
            meta.GetValueOrDefault("twitter:player"));

        if (ogVideo is not null)
        {
            var resolved = ResolveUrl(baseUri, ogVideo);
            if (resolved is not null && IsTrustedEmbed(resolved, baseUri))
            {
                var type = DetermineEmbedType(meta.GetValueOrDefault("og:video:type"), resolved);
                var width = ParseInt(meta.GetValueOrDefault("og:video:width"));
                var height = ParseInt(meta.GetValueOrDefault("og:video:height"));
                return new EmbedInfo(resolved, type, width, height);
            }
        }

        if (!string.IsNullOrWhiteSpace(oEmbed?.Html))
        {
            var iframeSrc = ExtractIframeSrc(oEmbed.Html!);
            if (iframeSrc is not null)
            {
                var resolved = ResolveUrl(baseUri, iframeSrc);
                if (resolved is not null && IsTrustedEmbed(resolved, baseUri))
                {
                    var type = DetermineEmbedType(oEmbed.Type, resolved);
                    return new EmbedInfo(resolved, type, oEmbed.Width, oEmbed.Height);
                }
            }
        }

        return null;
    }

    private static EmbedInfo? BuildKnownEmbed(Uri pageUri, Dictionary<string, string> meta)
    {
        var host = NormalizeHost(pageUri.Host);
        if (string.IsNullOrWhiteSpace(host)) return null;

        if (host.EndsWith("youtube.com", StringComparison.OrdinalIgnoreCase) ||
            host.Equals("youtu.be", StringComparison.OrdinalIgnoreCase) ||
            host.EndsWith("youtube-nocookie.com", StringComparison.OrdinalIgnoreCase))
        {
            var videoId = ExtractYouTubeVideoId(pageUri, meta);
            if (string.IsNullOrWhiteSpace(videoId)) return null;

            var query = ParseQuery(pageUri);
            var parameters = new List<string> { "rel=0", "playsinline=1" };

            if (query.TryGetValue("list", out var list) && !string.IsNullOrWhiteSpace(list))
            {
                parameters.Add($"list={Uri.EscapeDataString(list)}");
            }

            var startSeconds = ExtractYouTubeStart(query);
            if (startSeconds.HasValue)
            {
                parameters.Add($"start={startSeconds.Value}");
            }

            var embedUrl = $"https://www.youtube.com/embed/{videoId}";
            if (parameters.Count > 0)
            {
                embedUrl = $"{embedUrl}?{string.Join("&", parameters)}";
            }

            var width = ParseInt(meta.GetValueOrDefault("og:video:width")) ?? 560;
            var height = ParseInt(meta.GetValueOrDefault("og:video:height")) ?? 315;

            return new EmbedInfo(embedUrl, "iframe", width, height);
        }

        return null;
    }

    private static int? ExtractYouTubeStart(Dictionary<string, string> query)
    {
        if (query.TryGetValue("start", out var startValue) && ParseInt(startValue) is { } start)
        {
            return start;
        }

        if (query.TryGetValue("t", out var tValue))
        {
            return ParseYouTubeTimestamp(tValue);
        }

        return null;
    }

    private static int? ParseYouTubeTimestamp(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out var number))
        {
            return number;
        }

        var match = YouTubeTimestampRegex.Match(trimmed);
        if (!match.Success) return null;

        var hours = match.Groups["hours"].Success
            ? int.Parse(match.Groups["hours"].Value, CultureInfo.InvariantCulture)
            : 0;
        var minutes = match.Groups["minutes"].Success
            ? int.Parse(match.Groups["minutes"].Value, CultureInfo.InvariantCulture)
            : 0;
        var seconds = match.Groups["seconds"].Success
            ? int.Parse(match.Groups["seconds"].Value, CultureInfo.InvariantCulture)
            : 0;

        var total = hours * 3600 + minutes * 60 + seconds;
        return total > 0 ? total : (int?)null;
    }

    private static string? ExtractYouTubeVideoId(Uri uri, Dictionary<string, string> meta)
    {
        var host = NormalizeHost(uri.Host);
        if (string.IsNullOrWhiteSpace(host)) return null;

        var query = ParseQuery(uri);
        if (query.TryGetValue("v", out var vValue) && !string.IsNullOrWhiteSpace(vValue))
        {
            return vValue;
        }

        var segments = uri.AbsolutePath.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (host.Equals("youtu.be", StringComparison.OrdinalIgnoreCase))
        {
            return segments.Length > 0 ? segments[0] : null;
        }

        if (segments.Length >= 2 &&
            (segments[0].Equals("shorts", StringComparison.OrdinalIgnoreCase) ||
             segments[0].Equals("embed", StringComparison.OrdinalIgnoreCase) ||
             segments[0].Equals("live", StringComparison.OrdinalIgnoreCase) ||
             segments[0].Equals("v", StringComparison.OrdinalIgnoreCase)))
        {
            return segments[1];
        }

        if (meta.TryGetValue("og:video:url", out var ogVideo) && !string.IsNullOrWhiteSpace(ogVideo))
        {
            if (Uri.TryCreate(ogVideo, UriKind.Absolute, out var ogUri))
            {
                var ogSegments = ogUri.AbsolutePath.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
                if (ogSegments.Length >= 2 && ogSegments[0].Equals("embed", StringComparison.OrdinalIgnoreCase))
                {
                    return ogSegments[1];
                }
            }
        }

        return null;
    }

    private static string? ExtractIframeSrc(string html)
    {
        var match = IframeSrcRegex.Match(html);
        if (!match.Success) return null;
        var value = match.Groups["src"].Value;
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static bool IsTrustedEmbed(string embedUrl, Uri pageUri)
    {
        if (!Uri.TryCreate(embedUrl, UriKind.Absolute, out var uri)) return false;
        var embedHost = NormalizeHost(uri.Host);
        if (string.IsNullOrWhiteSpace(embedHost)) return false;

        if (TrustedEmbedHosts.Any(pattern => embedHost.EndsWith(pattern, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        var pageHost = NormalizeHost(pageUri.Host);
        return !string.IsNullOrWhiteSpace(pageHost) && embedHost.EndsWith(pageHost, StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeHost(string host)
    {
        return host.StartsWith("www.", StringComparison.OrdinalIgnoreCase) ? host[4..] : host;
    }

    private static string DetermineEmbedType(string? declaredType, string embedUrl)
    {
        if (!string.IsNullOrWhiteSpace(declaredType) &&
            declaredType.StartsWith("video", StringComparison.OrdinalIgnoreCase))
        {
            return "video";
        }

        var withoutQuery = embedUrl.Split('?', '#')[0];
        var extension = Path.GetExtension(withoutQuery);
        if (!string.IsNullOrWhiteSpace(extension))
        {
            var ext = extension.TrimStart('.').ToLowerInvariant();
            if (VideoFileExtensions.Contains(ext))
            {
                return "video";
            }
        }

        return "iframe";
    }

    private static int? ParseInt(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var number)
            ? number
            : (int?)null;
    }

    private static Dictionary<string, string> ParseAttributes(string tag)
    {
        var attributes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (Match match in AttributeRegex.Matches(tag))
        {
            var name = match.Groups["name"].Value;
            var value = match.Groups["value"].Value;
            attributes[name] = WebUtility.HtmlDecode(value);
        }
        return attributes;
    }

    private static Dictionary<string, string> ParseQuery(Uri uri)
    {
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrEmpty(uri.Query)) return dict;

        var pairs = uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries);
        foreach (var pair in pairs)
        {
            var parts = pair.Split('=', 2);
            if (parts.Length == 0) continue;
            var key = Uri.UnescapeDataString(parts[0]);
            var value = parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : string.Empty;
            dict[key] = value;
        }

        return dict;
    }

    private static async Task<string> ReadContentAsync(HttpContent content, CancellationToken cancellationToken)
    {
        await using var stream = await content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream, GetEncoding(content), detectEncodingFromByteOrderMarks: true, bufferSize: 8192, leaveOpen: false);
        var buffer = new char[8192];
        var total = 0;
        var builder = new StringBuilder();
        while (total < MaxDocumentChars)
        {
            var remaining = MaxDocumentChars - total;
            var read = await reader.ReadAsync(buffer, 0, Math.Min(buffer.Length, remaining));
            if (read <= 0)
            {
                break;
            }
            builder.Append(buffer, 0, read);
            total += read;
        }
        return builder.ToString();
    }

    private static Encoding GetEncoding(HttpContent content)
    {
        var charset = content.Headers.ContentType?.CharSet;
        if (!string.IsNullOrWhiteSpace(charset))
        {
            try
            {
                return Encoding.GetEncoding(charset);
            }
            catch (ArgumentException)
            {
                // ignore invalid charset and fall back
            }
        }
        return Encoding.UTF8;
    }

    private static string? ResolveUrl(Uri baseUri, string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        if (trimmed.StartsWith("//"))
        {
            return $"{baseUri.Scheme}:{trimmed}";
        }

        if (Uri.TryCreate(trimmed, UriKind.Absolute, out var absolute))
        {
            return absolute.ToString();
        }

        if (Uri.TryCreate(baseUri, trimmed, out var combined))
        {
            return combined.ToString();
        }

        return null;
    }

    private static string? TryGetHost(Uri uri)
    {
        var host = uri.Host;
        if (string.IsNullOrWhiteSpace(host)) return null;
        return host.StartsWith("www.", StringComparison.OrdinalIgnoreCase)
            ? host[4..]
            : host;
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }
        return null;
    }
}
