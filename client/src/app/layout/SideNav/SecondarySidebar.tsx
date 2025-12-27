import {Box} from "@mui/material";
import {useLocation} from "react-router";
import {useRef, useState} from "react";
import DefaultSidebarContent from "./DefaultSidebarContent";
import ChatRoomSidebarContent from "../../../features/chatRooms/ChatRoomSidebarContent";
import UserActionRibbon from "../UserActionRibbon";
import {NAV_WIDTH} from "../../../lib/types/constants";

export const DIRECT_SIDEBAR_WIDTH = 280;

type SecondarySidebarProps = {
  variant?: "desktop" | "drawer";
  showActionRibbon?: boolean;
};

export default function SecondarySidebar({
  variant = "desktop",
  showActionRibbon = true,
}: SecondarySidebarProps) {
  const location = useLocation();
  const showDefaultContent = !location.pathname.startsWith("/chat-rooms");
  const isDrawer = variant === "drawer";

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = Number(localStorage.getItem("secondarySidebarWidth"));
    return Number.isFinite(saved) && saved > 0 ? saved : DIRECT_SIDEBAR_WIDTH;
  });
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const ribbonTotalWidth = sidebarWidth + NAV_WIDTH;

  const resetToDefault = () => {
    setSidebarWidth(DIRECT_SIDEBAR_WIDTH);
    localStorage.setItem("secondarySidebarWidth", String(DIRECT_SIDEBAR_WIDTH));
  };

  const startResize = (e: React.MouseEvent) => {
    if (isDrawer) return;
    dragRef.current = {startX: e.clientX, startWidth: sidebarWidth};
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
        width: isDrawer ? "100%" : {xs: 0, sm: sidebarWidth},
        flex: isDrawer ? "1 1 auto" : {xs: "0 0 0px", sm: `0 0 ${sidebarWidth}px`},
        display: isDrawer ? "flex" : {xs: "none", sm: "flex"},
        flexDirection: "column",
        height: isDrawer ? "100%" : "100vh",
        position: isDrawer ? "relative" : "sticky",
        top: isDrawer ? "auto" : 0,
        bgcolor: "#1e1f24",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        overflow: "visible",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {showDefaultContent ? (
          <DefaultSidebarContent/>
        ) : (
          <ChatRoomSidebarContent/>
        )}
      </Box>
      {showActionRibbon && (
        <Box
          sx={{
            width: {xs: "100%", sm: `${ribbonTotalWidth}px`},
            ml: {xs: 0, sm: `-${NAV_WIDTH}px`},
            alignSelf: {xs: "stretch", sm: "flex-start"},
          }}
        >
          <UserActionRibbon/>
        </Box>
      )}
      {!isDrawer && (
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
            "&:hover": {bgcolor: "rgba(255,255,255,0.12)"},
          }}
        />
      )}
    </Box>
  );
}
