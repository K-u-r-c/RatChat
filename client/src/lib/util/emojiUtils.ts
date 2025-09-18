const EMOJI_MAPPINGS: Record<string, string> = {
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

export function convertTextToEmoji(text: string): string {
  let result = text;

  const sortedKeys = Object.keys(EMOJI_MAPPINGS).sort(
    (a, b) => b.length - a.length
  );

  for (const textEmoji of sortedKeys) {
    const emoji = EMOJI_MAPPINGS[textEmoji];
    const regex = new RegExp(`\\B${escapeRegExp(textEmoji)}\\B`, "g");
    result = result.replace(regex, emoji);
  }

  return result;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isOnlyEmoji(text: string): boolean {
  const trimmed = text.replace(/\s/g, "");

  if (!trimmed) return false;

  const emojiRegex =
    /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}\u{2395}\u{239B}-\u{23B9}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2B00}-\u{2BFF}\u{3030}\u{303D}\u{3297}\u{3299}]+$/u;

  return emojiRegex.test(trimmed);
}

export function countEmojis(text: string): number {
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}\u{2395}\u{239B}-\u{23B9}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2B00}-\u{2BFF}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;
  const matches = text.match(emojiRegex);
  return matches ? matches.length : 0;
}

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
