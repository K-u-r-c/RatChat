export type GifCropMeta = {
  cx: number;
  cy: number;
  scale: number;
};

const ensureUrl = (input: string, baseOrigin?: string) => {
  try {
    return new URL(input);
  } catch {
    if (typeof window !== "undefined" || baseOrigin) {
      const origin = baseOrigin ?? window.location.origin;
      try {
        return new URL(input, origin);
      } catch {
        return null;
      }
    }
    return null;
  }
};

export const appendGifCropToUrl = (
  baseUrl: string,
  crop: GifCropMeta,
  baseOrigin?: string
) => {
  const url = ensureUrl(baseUrl, baseOrigin);
  if (!url) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}cx=${crop.cx.toFixed(3)}&cy=${crop.cy.toFixed(3)}&s=${crop.scale.toFixed(4)}`;
  }

  url.searchParams.set("cx", crop.cx.toFixed(3));
  url.searchParams.set("cy", crop.cy.toFixed(3));
  url.searchParams.set("s", crop.scale.toFixed(4));
  return url.toString();
};

export const parseGifCropFromUrl = (
  imageUrl: string,
  baseOrigin?: string
): GifCropMeta | null => {
  const url = ensureUrl(imageUrl, baseOrigin);
  if (!url) return null;

  const cx = Number(url.searchParams.get("cx"));
  const cy = Number(url.searchParams.get("cy"));
  const scale = Number(url.searchParams.get("s"));

  if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(scale)) {
    return null;
  }

  return {
    cx: Math.max(0, Math.min(100, cx)),
    cy: Math.max(0, Math.min(100, cy)),
    scale: Math.max(1, scale),
  };
};

export const formatPercent = (value: number) => `${value.toFixed(3)}%`;

export const buildGifBackgroundStyles = (
  image: string,
  crop: GifCropMeta
) => ({
  backgroundImage: `url(${image})`,
  backgroundRepeat: "no-repeat",
  backgroundSize: `${(crop.scale * 100).toFixed(3)}% auto`,
  backgroundPosition: `${formatPercent(crop.cx)} ${formatPercent(crop.cy)}`,
});