import {useEffect, useMemo, useState} from "react";

const DEFAULT_SEED_COLOR = "#2b2d31";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const hashStringToHue = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
};

const buildHashedColor = (seed?: string) => {
  if (!seed) return DEFAULT_SEED_COLOR;
  const hue = hashStringToHue(seed);
  return `hsl(${hue}, 62%, 38%)`;
};

const normalizeColor = (rgb: { r: number; g: number; b: number }) => {
  const clampChannel = (channel: number) => clamp(Math.round(channel), 0, 255);
  const r = clampChannel(rgb.r);
  const g = clampChannel(rgb.g);
  const b = clampChannel(rgb.b);
  return `rgb(${r}, ${g}, ${b})`;
};

const computeAverageColor = (image: HTMLImageElement) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  const width = Math.min(image.naturalWidth || 64, 80);
  const height = Math.min(image.naturalHeight || 64, 80);

  if (width === 0 || height === 0) return null;

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  try {
    const { data } = context.getImageData(0, 0, width, height);
    let r = 0;
    let g = 0;
    let b = 0;
    const total = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    if (!total) return null;
    return normalizeColor({
      r: r / total,
      g: g / total,
      b: b / total,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to read avatar pixels for dominant color", error);
    }
    return null;
  }
};

export const useDominantColor = (
  imageUrl?: string | null,
  seed?: string
) => {
  const fallbackColor = useMemo(
    () => buildHashedColor(seed ?? imageUrl ?? undefined),
    [imageUrl, seed]
  );

  const [color, setColor] = useState<string>(fallbackColor);

  useEffect(() => {
    setColor(fallbackColor);
    if (!imageUrl) return;
    if (typeof window === "undefined") return;

    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";

    const handleLoad = () => {
      if (cancelled) return;
      const average = computeAverageColor(image);
      if (average) {
        setColor(average);
      } else {
        setColor(fallbackColor);
      }
    };

    const handleError = () => {
      if (cancelled) return;
      setColor(fallbackColor);
    };

    image.addEventListener("load", handleLoad);
    image.addEventListener("error", handleError);
    image.src = imageUrl;

    return () => {
      cancelled = true;
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
    };
  }, [imageUrl, fallbackColor]);

  return color;
};
