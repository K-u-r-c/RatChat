import {isDesktopRuntime} from "../environment/runtime";

const DESKTOP_REDIRECT_BASE = "ratchat-desktop://auth-callback";
const FALLBACK_WEB_REDIRECT = "https://ratchat.pl/auth-callback";
const FALLBACK_ORIGIN = "https://ratchat.pl";

type OAuthProvider = "github" | "google";

const resolveAbsoluteUrl = (input: string | undefined | null) => {
  const candidate = (input ?? "").trim();
  const value = candidate.length > 0 ? candidate : "/auth-callback";

  try {
    return new URL(value);
  } catch {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : FALLBACK_ORIGIN;
    try {
      return new URL(value, origin);
    } catch {
      return new URL(FALLBACK_WEB_REDIRECT);
    }
  }
};

const buildWebRedirectUrl = (provider: OAuthProvider, includeDesktopFlag: boolean) => {
  const base = resolveAbsoluteUrl(import.meta.env.VITE_REDIRECT_URL);
  base.searchParams.set("provider", provider);
  if (includeDesktopFlag) {
    base.searchParams.set("desktop", "1");
  } else {
    base.searchParams.delete("desktop");
  }
  return base.toString();
};

export const getOAuthRedirectUrl = (provider: OAuthProvider) => {
  if (isDesktopRuntime) {
    return buildWebRedirectUrl(provider, true);
  }
  return buildWebRedirectUrl(provider, false);
};

export const buildDesktopDeepLink = (
  provider: OAuthProvider,
  code: string | null
) => {
  const url = new URL(DESKTOP_REDIRECT_BASE);
  if (provider) {
    url.searchParams.set("provider", provider);
  }
  if (code) {
    url.searchParams.set("code", code);
  }
  return url.toString();
};

export const getDesktopRedirectBase = () => DESKTOP_REDIRECT_BASE;
