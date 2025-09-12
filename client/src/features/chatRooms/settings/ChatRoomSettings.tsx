import { useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import ChatRoomSettingsOverview from "./ChatRoomSettingsOverview";

type Props = {
  open: boolean;
  onClose: () => void;
  chatRoomId: string;
};

const tabs = [{ key: "overview", label: "Overview" }];

export default function ChatRoomSettings({ open, onClose, chatRoomId }: Props) {
  const [active, setActive] = useState("overview");

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Server Settings</DialogTitle>
      <Divider />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          minHeight: 520,
          overflow: "scroll",
        }}
      >
        <Box sx={{ borderRight: 1, borderColor: "divider", p: 1 }}>
          <List>
            {tabs.map((t) => (
              <ListItemButton
                key={t.key}
                selected={t.key === active}
                onClick={() => setActive(t.key)}
              >
                <ListItemText primary={t.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Box sx={{ p: 3, position: "relative" }}>
          {active === "overview" && (
            <ChatRoomSettingsOverview chatRoomId={chatRoomId} />
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
