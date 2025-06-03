import { Grid } from "@mui/material";
import ChatRoomsList from "./ChatRoomsList";

export default function ChatRoomsDashboard() {
  return (
    <Grid container spacing={3}>
      <Grid size={7}>
        <ChatRoomsList />
      </Grid>
      <Grid
        size={4}
        sx={{ position: "sticky", top: 112, alignSelf: "flex-start" }}
      >
        {/* <ChatRoomFilters /> */}
      </Grid>
    </Grid>
  );
}
