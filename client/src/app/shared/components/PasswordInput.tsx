import { useState } from "react";
import { IconButton, InputAdornment } from "@mui/material";
import { VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import TextInput from "./TextInput";
import type { FieldValues } from "react-hook-form";

type PasswordInputProps<T extends FieldValues> = Omit<
  React.ComponentProps<typeof TextInput<T>>,
  "type"
>;

export default function PasswordInput<T extends FieldValues>(
  props: PasswordInputProps<T>
) {
  const [showPassword, setShowPassword] = useState(false);

  const handleToggle = () => setShowPassword((show) => !show);

  return (
    <TextInput
      {...props}
      type={showPassword ? "text" : "password"}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={handleToggle}
                edge="end"
                tabIndex={-1}
                sx={{
                  color: "#70707B",
                  "&:hover": { color: "#A0A0B8" },
                }}
              >
                {showPassword ? (
                  <VisibilityOffOutlined />
                ) : (
                  <VisibilityOutlined />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
        ...(props.slotProps?.input || {}),
      }}
    />
  );
}
