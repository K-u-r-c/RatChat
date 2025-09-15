import { Box } from "@mui/material";
import { useLocation } from "react-router";
import DefaultSidebarContent from "./DefaultSidebarContent";
import ChatRoomSidebarContent from "../../../features/chatRooms/ChatRoomSidebarContent";
import { useRef, useState } from "react";

export const DIRECT_SIDEBAR_WIDTH = 280;

export default function SecondarySidebar() {
  const location = useLocation();
  const showDefaultContent = !location.pathname.startsWith("/chat-rooms");

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = Number(localStorage.getItem("secondarySidebarWidth"));
    return Number.isFinite(saved) && saved > 0 ? saved : DIRECT_SIDEBAR_WIDTH;
  });
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const resetToDefault = () => {
    setSidebarWidth(DIRECT_SIDEBAR_WIDTH);
    localStorage.setItem("secondarySidebarWidth", String(DIRECT_SIDEBAR_WIDTH));
  };

  const startResize = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startWidth: sidebarWidth };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const next = Math.min(
        Math.max(dragRef.current.startWidth + dx, 200),
        480
      );
      setSidebarWidth(next);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      dragRef.current = null;
      localStorage.setItem("secondarySidebarWidth", String(sidebarWidth));
      document.body.style.cursor = "";
      (document.body.style as CSSStyleDeclaration).userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    (document.body.style as CSSStyleDeclaration).userSelect = "none";
  };

  return (
    <Box
      component="aside"
      sx={{
        width: { xs: 0, sm: sidebarWidth },
        flex: { xs: "0 0 0px", sm: `0 0 ${sidebarWidth}px` },
        display: { xs: "none", sm: "flex" },
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        bgcolor: "#1e1f24",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {showDefaultContent ? (
        <DefaultSidebarContent />
      ) : (
        <ChatRoomSidebarContent />
      )}
      {/* Resize handle */}
      <Box
        role="separator"
        aria-orientation="vertical"
        onMouseDown={startResize}
        onDoubleClick={resetToDefault}
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 4,
          height: "100%",
          cursor: "col-resize",
          bgcolor: "rgba(255,255,255,0.06)",
          "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
        }}
      />
    </Box>
  );
}
