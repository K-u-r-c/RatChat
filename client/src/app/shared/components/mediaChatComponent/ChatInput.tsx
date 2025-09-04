import { Box, TextField, IconButton, CircularProgress } from "@mui/material";
import { AttachFile } from "@mui/icons-material";
import { useForm, type FieldValues } from "react-hook-form";
import EmojiPickerComponent from "../EmojiPicker";

interface ChatInputProps {
  onSubmit: (data: FieldValues) => Promise<void>;
  onFileSelect: () => void;
  onEmojiSelect?: (emoji: string) => void;
  onQuickReact?: (emoji: string) => void;
  defaultEmoji: string;
  isSubmitting: boolean;
  isUploading: boolean;
  hasFileAttached: boolean;
  hasPermission: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSubmit,
  onFileSelect,
  onEmojiSelect,
  onQuickReact,
  defaultEmoji,
  isSubmitting,
  isUploading,
  hasFileAttached,
  hasPermission = true,
  placeholder = "Enter your message (Enter to submit, Ctrl+V to paste images, SHIFT + Enter for new line)",
}: ChatInputProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const currentMessage = watch("body") || "";

  const handleFormSubmit = async (data: FieldValues) => {
    await onSubmit(data);
    reset();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(handleFormSubmit)();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const newValue = currentMessage + emoji;
    setValue("body", newValue);
    if (onEmojiSelect) {
      onEmojiSelect(emoji);
    }
  };

  const handleQuickReact = (emoji: string) => {
    setValue("body", emoji);
    handleSubmit(handleFormSubmit)();
    if (onQuickReact) {
      onQuickReact(emoji);
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
      <TextField
        {...register("body")}
        variant="outlined"
        fullWidth
        multiline
        rows={2}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        disabled={!hasPermission}
        slotProps={{
          input: {
            endAdornment:
              isSubmitting || isUploading ? (
                <CircularProgress size={24} />
              ) : null,
          },
        }}
      />
      <EmojiPickerComponent
        onEmojiSelect={handleEmojiSelect}
        onQuickReact={handleQuickReact}
        defaultEmoji={defaultEmoji}
        disabled={isSubmitting || isUploading}
      />
      <IconButton
        onClick={onFileSelect}
        color="primary"
        sx={{ mb: 0.5 }}
        title="Attach file"
        disabled={hasFileAttached}
      >
        <AttachFile />
      </IconButton>
    </Box>
  );
}
