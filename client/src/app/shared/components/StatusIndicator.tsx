import { Box, Tooltip } from "@mui/material";
import type { UserStatus } from "../../../lib/hooks/useStatus";

type Props = {
  status: UserStatus | string;
  customMessage?: string;
  size?: "small" | "medium" | "large";
  showTooltip?: boolean;
};

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "online":
      return "#4CAF50"; // Green
    case "away":
      return "#FF9800"; // Orange
    case "donotdisturb":
      return "#F44336"; // Red
    case "invisible":
    case "offline":
    default:
      return "#9E9E9E"; // Gray
  }
};

const getStatusText = (status: string): string => {
  switch (status.toLowerCase()) {
    case "online":
      return "Online";
    case "away":
      return "Away";
    case "donotdisturb":
      return "Do Not Disturb";
    case "invisible":
    case "offline":
    default:
      return "Offline";
  }
};

const getSizeValue = (size: "small" | "medium" | "large"): number => {
  switch (size) {
    case "small":
      return 8;
    case "medium":
      return 12;
    case "large":
    default:
      return 16;
  }
};

export default function StatusIndicator({
  status,
  customMessage,
  size = "medium",
  showTooltip = true,
}: Props) {
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);
  const sizeValue = getSizeValue(size);

  const indicator = (
    <Box
      sx={{
        width: sizeValue,
        height: sizeValue,
        backgroundColor: statusColor,
        borderRadius: "50%",
        border: "0.1px solid white",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
        flexShrink: 0,
      }}
    />
  );

  if (!showTooltip) {
    return indicator;
  }

  const tooltipTitle = customMessage
    ? `${statusText} - ${customMessage}`
    : statusText;

  return (
    <Tooltip title={tooltipTitle} placement="top">
      {indicator}
    </Tooltip>
  );
}
