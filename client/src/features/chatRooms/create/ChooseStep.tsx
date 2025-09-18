import {
  Typography,
  ListItemButton,
  ListItemText,
  Divider,
  ListItem,
} from "@mui/material";
import { GroupAdd, Link as LinkIcon } from "@mui/icons-material";
import { useStore } from "../../../lib/hooks/useStore";

const ChooseStep = () => {
  const { uiStore } = useStore();
  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => uiStore.goToCreateStep()}
          sx={{
            bgcolor: "#2f3136",
            borderRadius: 2,
            mb: 1,
            "&:hover": { bgcolor: "#3a3c43" },
          }}
        >
          <GroupAdd sx={{ mr: 2 }} />
          <ListItemText
            primary={
              <Typography sx={{ color: "#fff" }}>Create My Own</Typography>
            }
            secondary={
              <Typography variant="body2" color="text.secondary">
                Start a new chat room
              </Typography>
            }
          />
        </ListItemButton>
      </ListItem>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 2 }} />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ px: 0.5, mb: 1 }}
      >
        Already have an invite?
      </Typography>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => uiStore.goToJoinStep()}
          sx={{
            bgcolor: "#2f3136",
            borderRadius: 2,
            "&:hover": { bgcolor: "#3a3c43" },
          }}
        >
          <LinkIcon sx={{ mr: 2 }} />
          <ListItemText
            primary={
              <Typography sx={{ color: "#fff" }}>Join a Chat Room</Typography>
            }
          />
        </ListItemButton>
      </ListItem>
    </>
  );
};

export default ChooseStep;
