type DesktopAwareWindow = Window & {
  __RATCHAT_DESKTOP__?: boolean;
  RatChatDesktop?: unknown;
};

export function isRunningInDesktopShell() {
  if (typeof window === "undefined") return false;

  const desktopWindow = window as DesktopAwareWindow;

  if (desktopWindow.__RATCHAT_DESKTOP__) return true;
  if (desktopWindow.RatChatDesktop) return true;

  return /electron/i.test(navigator.userAgent ?? "");
}
