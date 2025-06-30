// Emoji conversion mappings for text to emoji
const EMOJI_MAPPINGS: Record<string, string> = {
  // Smileys & Emotion
  ":)": "😊",
  ":-)": "😊",
  ":(": "😞",
  ":-(": "😞",
  ":D": "😃",
  ":-D": "😃",
  ";)": "😉",
  ";-)": "😉",
  ":P": "😛",
  ":-P": "😛",
  ":p": "😛",
  ":-p": "😛",
  ":o": "😮",
  ":-o": "😮",
  ":O": "😮",
  ":-O": "😮",
  ":|": "😐",
  ":-|": "😐",
  ":/": "😕",
  ":-/": "😕",
  ":\\": "😕",
  ":-\\": "😕",
  ":*": "😘",
  ":-*": "😘",
  "<3": "❤️",
  "</3": "💔",
  ":heart:": "❤️",
  ":broken_heart:": "💔",
  ":thumbsup:": "👍",
  ":thumbsdown:": "👎",
  ":clap:": "👏",
  ":wave:": "👋",
  ":fire:": "🔥",
  ":100:": "💯",
  ":ok:": "👌",
  ":pray:": "🙏",
  ":muscle:": "💪",
  ":eyes:": "👀",
  ":thinking:": "🤔",
  ":laughing:": "😂",
  ":joy:": "😂",
  ":sob:": "😭",
  ":rage:": "😡",
  ":innocent:": "😇",
  ":wink:": "😉",
  ":stuck_out_tongue:": "😛",
  ":sunglasses:": "😎",
  ":confused:": "😕",
  ":disappointed:": "😞",
  ":worried:": "😟",
  ":angry:": "😠",
  ":cry:": "😢",
  ":fearful:": "😨",
  ":tired:": "😴",
  ":yum:": "😋",
  ":mask:": "😷",
  ":cold_sweat:": "😰",
  ":sweat_smile:": "😅",
  ":sweat:": "😓",
  ":triumph:": "😤",
  ":sleepy:": "😪",
  ":relieved:": "😌",
  ":expressionless:": "😑",
  ":unamused:": "😒",
  ":sweat_drops:": "💦",
  ":pensive:": "😔",
  ":persevere:": "😣",
  ":frowning:": "😦",
  ":anguished:": "😧",
  ":hushed:": "😯",
  ":sleeping:": "😴",
  ":dizzy_face:": "😵",
  ":astonished:": "😲",
  ":zipper_mouth:": "🤐",
  ":nauseated:": "🤢",
  ":sneezing:": "🤧",
  ":drooling:": "🤤",
  ":money_mouth:": "🤑",
  ":nerd:": "🤓",
  ":cowboy:": "🤠",
  ":clown:": "🤡",
  ":lying:": "🤥",
  ":shush:": "🤫",
  ":raised_hand:": "🤚",
  ":peace:": "✌️",
  ":crossed_fingers:": "🤞",
  ":vulcan:": "🖖",
  ":call_me:": "🤙",
  ":point_left:": "👈",
  ":point_right:": "👉",
  ":point_up:": "👆",
  ":middle_finger:": "🖕",
  ":point_down:": "👇",
  ":raised_hands:": "🙌",
  ":open_hands:": "👐",
  ":handshake:": "🤝",
  ":fist:": "👊",
  ":punch:": "👊",
  ":love_you:": "🤟",
  ":metal:": "🤘",
  ":writing:": "✍️",
  ":selfie:": "🤳",
  ":flex:": "💪",
  ":leg:": "🦵",
  ":foot:": "🦶",
  ":ear:": "👂",
  ":nose:": "👃",
  ":brain:": "🧠",
  ":tooth:": "🦷",
  ":bone:": "🦴",
  ":tongue:": "👅",
  ":lips:": "👄",
  ":baby:": "👶",
  ":child:": "🧒",
  ":boy:": "👦",
  ":girl:": "👧",
  ":adult:": "🧑",
  ":man:": "👨",
  ":woman:": "👩",
  ":older_adult:": "🧓",
  ":old_man:": "👴",
  ":old_woman:": "👵",
};

/**
 * Converts text emoticons to emojis in a string
 */
export function convertTextToEmoji(text: string): string {
  let result = text;

  // Sort keys by length (descending) to handle longer patterns first
  const sortedKeys = Object.keys(EMOJI_MAPPINGS).sort(
    (a, b) => b.length - a.length
  );

  for (const textEmoji of sortedKeys) {
    const emoji = EMOJI_MAPPINGS[textEmoji];
    // Use word boundaries for colon-based emojis, simple replacement for others
    if (textEmoji.startsWith(":") && textEmoji.endsWith(":")) {
      const regex = new RegExp(`\\B${escapeRegExp(textEmoji)}\\B`, "g");
      result = result.replace(regex, emoji);
    } else {
      // For simple emoticons like :) :( etc., use word boundaries
      const regex = new RegExp(`\\B${escapeRegExp(textEmoji)}\\B`, "g");
      result = result.replace(regex, emoji);
    }
  }

  return result;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check if a string contains only emojis and whitespace
 */
export function isOnlyEmoji(text: string): boolean {
  // Remove all whitespace
  const trimmed = text.replace(/\s/g, "");

  // If empty after removing whitespace, it's not only emoji
  if (!trimmed) return false;

  // Check if the string contains only emoji characters
  // This regex matches most emoji characters
  const emojiRegex =
    /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}\u{2395}\u{239B}-\u{23B9}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2B00}-\u{2BFF}\u{3030}\u{303D}\u{3297}\u{3299}]+$/u;

  return emojiRegex.test(trimmed);
}

/**
 * Get the default emoji for a chat room or direct chat
 */
export function getDefaultEmoji(
  chatType: "chatroom" | "direct",
  chatId: string
): string {
  // Try to get from localStorage first
  const storageKey = `defaultEmoji_${chatType}_${chatId}`;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }
  } catch (error) {
    // localStorage might not be available
    console.warn("Could not access localStorage for emoji settings:", error);
  }

  // Return default emoji
  return "👍";
}

/**
 * Set the default emoji for a chat room or direct chat
 */
export function setDefaultEmoji(
  chatType: "chatroom" | "direct",
  chatId: string,
  emoji: string
): void {
  const storageKey = `defaultEmoji_${chatType}_${chatId}`;

  try {
    localStorage.setItem(storageKey, emoji);
  } catch (error) {
    // localStorage might not be available
    console.warn("Could not save emoji settings to localStorage:", error);
  }
}

/**
 * Count emojis in a string (for display purposes)
 */
export function countEmojis(text: string): number {
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}\u{2395}\u{239B}-\u{23B9}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2B00}-\u{2BFF}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;
  const matches = text.match(emojiRegex);
  return matches ? matches.length : 0;
}

/**
 * Format message with proper emoji size based on content
 */
export function formatMessageWithEmojis(text: string): {
  text: string;
  isLargeEmoji: boolean;
} {
  const convertedText = convertTextToEmoji(text);
  const isLargeEmoji =
    isOnlyEmoji(convertedText) && countEmojis(convertedText) <= 3;

  return {
    text: convertedText,
    isLargeEmoji,
  };
}
