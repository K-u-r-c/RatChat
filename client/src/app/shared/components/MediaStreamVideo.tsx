import {type CSSProperties, useEffect, useMemo, useRef, type VideoHTMLAttributes} from "react";

export type MediaStreamVideoProps = VideoHTMLAttributes<HTMLVideoElement> & {
  stream?: MediaStream | null;
  mirrored?: boolean;
  fit?: "cover" | "contain";
};

export default function MediaStreamVideo(
  {
    stream,
    mirrored = false,
    fit = "cover",
    autoPlay = true,
    playsInline = true,
    muted = true,
    style,
    ...rest
  }: MediaStreamVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.srcObject as MediaStream | null;
    if (current === stream) return;
    video.srcObject = stream ?? null;
  }, [stream]);

  const baseStyle = useMemo<CSSProperties>(() => ({
    width: "100%",
    height: "auto",
    maxWidth: "100%",
    maxHeight: "100vh",
    objectFit: fit,
    objectPosition: "center",
    display: "block",
    backgroundColor: fit === "contain" ? "#000" : undefined,
    transform: mirrored ? "scaleX(-1)" : undefined,
  }), [fit, mirrored]);

  const mergedStyle = useMemo<CSSProperties>(
    () => ({
      ...baseStyle,
      ...style,
    }),
    [baseStyle, style]
  );

  return (
    <video
      ref={videoRef}
      autoPlay={autoPlay}
      playsInline={playsInline}
      muted={muted}
      style={mergedStyle}
      {...rest}
    />
  );
}