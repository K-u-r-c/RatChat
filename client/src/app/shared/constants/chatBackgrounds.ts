export type ChatBackgroundKey =
  | "default"
  | "midnight"
  | "dusk"
  | "ocean"
  | "forest"
  | "carbon";

export type ChatBackgroundStyle = {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundBlendMode?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
};

export type ChatBackgroundOption = {
  key: ChatBackgroundKey;
  label: string;
  description: string;
  previewStyle: ChatBackgroundStyle;
};

export type ChatBackgroundSelection = ChatBackgroundKey | "custom";

export const DEFAULT_CHAT_BACKGROUND_KEY: ChatBackgroundKey = "default";

export const CHAT_BACKGROUND_STYLES: Record<
  ChatBackgroundKey,
  ChatBackgroundStyle
> = {
  default: {
    backgroundColor: "transparent",
  },
  midnight: {
    backgroundImage: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
  },
  dusk: {
    backgroundImage: "linear-gradient(135deg, #42275a 0%, #734b6d 100%)",
  },
  ocean: {
    backgroundImage:
      "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
  },
  forest: {
    backgroundImage: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
  },
  carbon: {
    backgroundImage:
      "radial-gradient(circle at 0 0, #444 15%, transparent 15%), radial-gradient(circle at 10px 10px, #444 15%, transparent 15%)",
    backgroundSize: "20px 20px",
    backgroundColor: "#1f1f25",
  },
};

export const CHAT_BACKGROUND_OPTIONS: ChatBackgroundOption[] = [
  {
    key: "default",
    label: "Default",
    description: "Use the standard app background.",
    previewStyle: CHAT_BACKGROUND_STYLES.default,
  },
  {
    key: "midnight",
    label: "Midnight",
    description: "Deep blues for a focused conversation.",
    previewStyle: CHAT_BACKGROUND_STYLES.midnight,
  },
  {
    key: "dusk",
    label: "Dusk",
    description: "Warm purples with a subtle gradient.",
    previewStyle: CHAT_BACKGROUND_STYLES.dusk,
  },
  {
    key: "ocean",
    label: "Ocean",
    description: "Calming teal tones inspired by waves.",
    previewStyle: CHAT_BACKGROUND_STYLES.ocean,
  },
  {
    key: "forest",
    label: "Forest",
    description: "Rich greens for a grounded feel.",
    previewStyle: CHAT_BACKGROUND_STYLES.forest,
  },
  {
    key: "carbon",
    label: "Carbon",
    description: "Subtle carbon fiber texture.",
    previewStyle: CHAT_BACKGROUND_STYLES.carbon,
  },
];

export function getChatBackgroundStyle(
  key: string | undefined,
  customUrl?: string | null
): ChatBackgroundStyle {
  if (!key) return CHAT_BACKGROUND_STYLES[DEFAULT_CHAT_BACKGROUND_KEY];

  if (key === "custom") {
    if (customUrl) {
      return {
        backgroundImage: "url(" + customUrl + ")",
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    return {
      backgroundColor: "transparent",
    };
  }

  if (key in CHAT_BACKGROUND_STYLES) {
    return CHAT_BACKGROUND_STYLES[key as ChatBackgroundKey];
  }
  return CHAT_BACKGROUND_STYLES[DEFAULT_CHAT_BACKGROUND_KEY];
}
