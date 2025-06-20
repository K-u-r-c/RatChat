import { Box, Typography, List } from "@mui/material";
import type { FriendRequestsResponse } from "../../lib/types";
import { ReceivedRequestItem, SentRequestItem } from "./FriendRequestItem";

type FriendRequestsTabProps = {
  friendRequests: FriendRequestsResponse | undefined;
  isLoading: boolean;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onCancelRequest: (requestId: string) => void;
  isResponding: boolean;
  isCanceling: boolean;
};

export function FriendRequestsTab({
  friendRequests,
  isLoading,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  isResponding,
  isCanceling,
}: FriendRequestsTabProps) {
  if (isLoading) {
    return <Typography>Loading friend requests...</Typography>;
  }

  const hasReceivedRequests = friendRequests?.received?.length;
  const hasSentRequests = friendRequests?.sent?.length;

  if (!hasReceivedRequests && !hasSentRequests) {
    return <Typography color="text.secondary">No friend requests</Typography>;
  }

  return (
    <Box>
      {/* Received Requests */}
      {hasReceivedRequests ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Received Requests
          </Typography>
          <List>
            {friendRequests.received.map((request) => (
              <ReceivedRequestItem
                key={request.id}
                request={request}
                onAccept={onAcceptRequest}
                onDecline={onDeclineRequest}
                isResponding={isResponding}
              />
            ))}
          </List>
        </Box>
      ) : null}

      {/* Sent Requests */}
      {hasSentRequests ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            Sent Requests
          </Typography>
          <List>
            {friendRequests.sent.map((request) => (
              <SentRequestItem
                key={request.id}
                request={request}
                onCancel={onCancelRequest}
                isCanceling={isCanceling}
              />
            ))}
          </List>
        </Box>
      ) : null}
    </Box>
  );
}
