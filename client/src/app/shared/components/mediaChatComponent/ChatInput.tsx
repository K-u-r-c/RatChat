import {AttachFile, Send} from "@mui/icons-material";
import {Box, CircularProgress, IconButton, TextField} from "@mui/material";
import {type Ref, useRef, useState} from "react";
import {type FieldValues, useForm} from "react-hook-form";
import EmojiPickerComponent from "../EmojiPicker";

interface ChatInputProps {
  onSubmit: (data: FieldValues) => Promise<void>;
  onFileSelect: () => void;
  onEmojiSelect?: (emoji: string) => void;
  onQuickReact?: (emoji: string) => void;
  defaultEmoji: string;
  isSubmitting: boolean;
  isUploading: boolean;
  hasPermission: boolean;
  placeholder?: string;
  hasAttachment?: boolean;
  inputRef?: Ref<HTMLInputElement | HTMLTextAreaElement>;
}

export default function ChatInput(
  {
    onSubmit,
    onFileSelect,
    onEmojiSelect,
    onQuickReact,
    defaultEmoji,
    isSubmitting,
    isUploading,
    hasPermission = true,
    placeholder = "Enter your message...",
    hasAttachment = false,
    inputRef,
  }: ChatInputProps) {
  const {register, handleSubmit, reset, setValue, watch} = useForm();
  const clickLockRef = useRef(false);
  const [localSending, setLocalSending] = useState(false);
  const currentMessage = watch("body") || "";
  const canSend =
    hasPermission &&
    !isSubmitting &&
    !localSending &&
    !isUploading &&
    ((currentMessage?.trim?.().length ?? 0) > 0 || hasAttachment);

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

  const handleDefaultEmoji = (emoji: string) => {
    setValue("body", emoji);
    handleSubmit(handleFormSubmit)();
    if (onQuickReact) {
      onQuickReact(emoji);
    }
  };

  return (
    <Box sx={{
      display: "flex", gap: 1, alignItems: "center",
      bgcolor: "background.default",
    }}>
      {/* Attach file on the left */}
      <IconButton
        onClick={onFileSelect}
        color="primary"
        title="Attach file"
        disabled={!hasPermission || isSubmitting || isUploading}
      >
        <AttachFile/>
      </IconButton>

      {/* Input with emoji picker*/}
      <TextField
        {...register("body")}
        variant="outlined"
        fullWidth
        multiline
        maxRows={8}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        disabled={!hasPermission}
        inputRef={inputRef}
        slotProps={{
          input: {
            endAdornment: (
              <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                {isSubmitting || isUploading ? (
                  <CircularProgress size={20}/>
                ) : null}
                <EmojiPickerComponent
                  variant="standard"
                  onEmojiSelect={handleEmojiSelect}
                  showQuickReact={false}
                  disabled={isSubmitting || isUploading}
                />
                {canSend && (
                  <IconButton
                    aria-label="Send message"
                    color="primary"
                    onClick={async () => {
                      if (clickLockRef.current) return;
                      clickLockRef.current = true;
                      setLocalSending(true);
                      try {
                        const doSubmit = handleSubmit(handleFormSubmit);
                        await Promise.resolve(doSubmit());
                      } finally {
                        setLocalSending(false);
                        clickLockRef.current = false;
                      }
                    }}
                    disabled={!canSend}
                    size="small"
                  >
                    <Send fontSize="small"/>
                  </IconButton>
                )}
              </Box>
            ),
          },
        }}
        sx={{
          bgcolor: "background.paper",
          borderRadius: 2,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent !important",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent !important",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent !important",
          },
          "& .MuiInputBase-input, & .MuiInputBase-inputMultiline": {
            color: "#fff",
            "&::placeholder": {color: "rgba(255,255,255,0.6)"},
            paddingRight: 0,
          },
        }}
      />

      {/* Default emoji on the right of the input */}
      <IconButton
        onClick={() => handleDefaultEmoji(defaultEmoji)}
        disabled={!hasPermission || isSubmitting || isUploading}
        size="small"
        title={`Quick react with ${defaultEmoji}`}
        sx={{
          fontSize: "1.4rem",
          width: 36,
          height: 36,
          borderRadius: "50%",
        }}
      >
        {defaultEmoji}
      </IconButton>
    </Box>
  );
}
