import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Box } from "@mui/material";

type Props = {
  children: ReactNode;
  durationMs?: number;
  easing?: string;
};

export default function AnimatedAutoHeight({
  children,
  durationMs = 180,
  easing = "ease-in-out",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  const measure = () => {
    const el = contentRef.current;
    if (!el) return;
    const next = el.getBoundingClientRect().height;
    setHeight(next);
  };

  useLayoutEffect(() => {
    measure();
  });

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        height: height ?? "auto",
        overflow: "hidden",
        transition: `height ${durationMs}ms ${easing}`,
      }}
    >
      <Box ref={contentRef}>{children}</Box>
    </Box>
  );
}
