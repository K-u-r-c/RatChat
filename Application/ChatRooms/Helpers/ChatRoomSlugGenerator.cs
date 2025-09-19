using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.ChatRooms.Helpers;

public static partial class ChatRoomSlugGenerator
{
    private static readonly Regex NonSlugCharacters = MyRegex();

    public static async Task<string> GenerateUniqueSlugAsync(
        AppDbContext context,
        string title,
        string? excludeChatRoomId = null,
        ISet<string>? reservedSlugs = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        var baseSlug = ToSlug(title);
        var candidate = baseSlug;
        var suffix = 2;

        while (await context.ChatRooms
                   .AsNoTracking()
                   .AnyAsync(x => x.Slug == candidate && x.Id != excludeChatRoomId, cancellationToken)
               || (reservedSlugs?.Contains(candidate) ?? false))
        {
            candidate = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return candidate;
    }

    private static string ToSlug(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return $"chatroom-{Guid.NewGuid().ToString("N")[..8]}";
        }

        var slug = NonSlugCharacters
            .Replace(input.ToLowerInvariant(), "-")
            .Trim('-');

        if (string.IsNullOrWhiteSpace(slug))
        {
            slug = $"chatroom-{Guid.NewGuid().ToString("N")[..8]}";
        }

        if (slug.Length > 120)
        {
            slug = slug[..120].Trim('-');
        }

        return string.IsNullOrWhiteSpace(slug)
            ? $"chatroom-{Guid.NewGuid().ToString("N")[..8]}"
            : slug;
    }

    [GeneratedRegex("[^a-z0-9]+", RegexOptions.Compiled)]
    private static partial Regex MyRegex();

}

