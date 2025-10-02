using System.Text.RegularExpressions;
using Domain.Enums;

namespace Application.ChatChannels.Helpers;

public static partial class ChatChannelNameHelper
{
    private static readonly Regex InvalidTextChannelCharactersRegex = InvalidTextChannelCharacters();
    private static readonly Regex DuplicateDashRegex = DuplicateDash();

    public static string Normalize(string name, ChatChannelType type)
    {
        if (string.IsNullOrWhiteSpace(name)) return string.Empty;

        var trimmed = name.Trim();

        if (type == ChatChannelType.Text)
        {
            trimmed = trimmed.ToLowerInvariant();
            trimmed = trimmed.Replace(' ', '-');
            trimmed = InvalidTextChannelCharactersRegex.Replace(trimmed, "-");
            trimmed = DuplicateDashRegex.Replace(trimmed, "-");
            trimmed = trimmed.Trim('-');
        }

        return trimmed;
    }

    [GeneratedRegex("[^a-z0-9-_]")]
    private static partial Regex InvalidTextChannelCharacters();

    [GeneratedRegex("-{2,}")]
    private static partial Regex DuplicateDash();
}
