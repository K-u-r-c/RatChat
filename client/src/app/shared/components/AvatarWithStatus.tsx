import { Avatar, Box, type AvatarProps } from "@mui/material";
import StatusIndicator from "./StatusIndicator";
import type { ReactNode } from "react";

type Props = {
  src?: string;
  alt?: string;
  children?: ReactNode;
  size?: number | { width: number; height: number };
  status?: string;
  showStatus?: boolean;
  statusSize?: "small" | "medium" | "large";
  sx?: AvatarProps["sx"];
  component?: React.ElementType;
  to?: string;
  onClick?: () => void;
  containerSx?: object;
};

export default function AvatarWithStatus({
  src,
  alt,
  children,
  size,
  status,
  showStatus = true,
  statusSize = "small",
  sx,
  component,
  to,
  onClick,
  containerSx,
  ...avatarProps
}: Props) {
  const avatarSize =
    typeof size === "number" ? { width: size, height: size } : size;

  const avatar = (
    <Box
      sx={{
        position: "relative",
        display: "inline-block",
        ...containerSx,
      }}
    >
      <Avatar
        src={src}
        alt={alt}
        sx={{
          ...avatarSize,
          ...sx,
        }}
        {...avatarProps}
      >
        {children}
      </Avatar>

      {showStatus && status && (
        <Box
          sx={{
            position: "absolute",
            bottom: -2,
            right: -2,
            backgroundColor: "white",
            borderRadius: "50%",
            padding: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <StatusIndicator status={status} size={statusSize} />
        </Box>
      )}
    </Box>
  );

  if (component) {
    const WrapperComponent = component;
    return (
      <WrapperComponent to={to} onClick={onClick}>
        {avatar}
      </WrapperComponent>
    );
  }

  if (onClick) {
    return (
      <Box onClick={onClick} sx={{ cursor: "pointer" }}>
        {avatar}
      </Box>
    );
  }

  return avatar;
}
