import { Avatar, Box, type AvatarProps } from "@mui/material";
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
        display: "inline-block",
        ...containerSx,
        position: "relative",
      }}
    >
      <Avatar
        src={src}
        alt={alt}
        sx={{
          position: "relative",
          ...avatarSize,
          ...sx,
        }}
        {...avatarProps}
      >
        {children}
      </Avatar>
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
