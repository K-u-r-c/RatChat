import { Box, Typography } from "@mui/material";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import ChatRoomCard from "./ChatRoomCard";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";

const ChatRoomsList = observer(function ActivityList() {
  const {
    chatRoomsGroup: chatRoomsGroup,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useChatRooms();
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  if (isLoading) return <Typography>Loading...</Typography>;
  if (!chatRoomsGroup) return <Typography>No chat rooms found</Typography>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {chatRoomsGroup.pages.map((chatRooms, index) => (
        <Box
          ref={index === chatRoomsGroup.pages.length - 1 ? ref : null}
          key={index}
          display={"flex"}
          flexDirection={"column"}
          gap={3}
        >
          {chatRooms.items.map((chatRoom) => (
            <ChatRoomCard key={chatRoom.id} chatRoom={chatRoom} />
          ))}
        </Box>
      ))}
    </Box>
  );
});

export default ChatRoomsList;
