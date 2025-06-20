import AvatarWithStatus from "./AvatarWithStatus";
import { Link } from "react-router";
import { useStatus } from "../../../lib/hooks/useStatus";

type Props = {
  userId: string;
  imageUrl?: string;
  displayName: string;
  showUserProfiles?: boolean;
};

export default function MessageAvatarWithStatus({
  userId,
  imageUrl,
  displayName,
  showUserProfiles = true,
}: Props) {
  const { useUserStatus } = useStatus();
  const { data: userStatus } = useUserStatus(userId);

  return (
    <AvatarWithStatus
      src={imageUrl}
      alt={displayName + " image"}
      status={userStatus?.status}
      component={showUserProfiles ? Link : undefined}
      to={showUserProfiles ? `/profiles/${userId}` : undefined}
      containerSx={{ mr: 2 }}
    />
  );
}
