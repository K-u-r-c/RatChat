// Reusable confirmation dialog component to replace window.confirm
// Supports customizing title, message, confirm/cancel text, color, variant, processing state, and accessibility labels.
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography} from "@mui/material";
import {Close} from "@mui/icons-material";
import type {ReactNode} from "react";
import {useCallback, useEffect} from "react";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  /** Main message displayed inside the dialog */
  message: ReactNode;
  /** Optional title displayed at the top */
  title?: ReactNode;
  /** Text of the confirm button (default: "Confirm") */
  confirmText?: string;
  /** MUI color of the confirm button (default: "primary") */
  confirmColor?: "primary" | "secondary" | "error" | "info" | "warning" | "success" | undefined;
  /** Variant of the confirm button (default: contained) */
  confirmVariant?: "text" | "outlined" | "contained";
  /** Text of the cancel button (default: "Cancel") */
  cancelText?: string;
  /** When true, buttons are disabled and confirm button shows processing state */
  isProcessing?: boolean;
  /** Disable closing the dialog with Escape / backdrop when processing (default: true) */
  lockWhileProcessing?: boolean;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
};

export function ConfirmDialog({
                                open,
                                onClose,
                                onConfirm,
                                message,
                                title,
                                confirmText = "Confirm",
                                confirmColor = "primary",
                                confirmVariant = "contained",
                                cancelText = "Cancel",
                                isProcessing = false,
                                lockWhileProcessing = true,
                                ariaLabel,
                              }: ConfirmDialogProps) {
  const handleClose = useCallback(() => {
    if (isProcessing && lockWhileProcessing) return;
    onClose();
  }, [isProcessing, lockWhileProcessing, onClose]);

  const handleConfirm = useCallback(() => {
    if (isProcessing) return;
    onConfirm();
  }, [isProcessing, onConfirm]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleConfirm, handleClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      aria-label={ariaLabel}
      aria-describedby={ariaLabel ? `${ariaLabel}-desc` : undefined}
    >
      {title && (
        <DialogTitle sx={{pr: 6}}>
          {title}
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{position: "absolute", right: 12, top: 12}}
            aria-label="Close"
            disabled={isProcessing && lockWhileProcessing}
          >
            <Close fontSize="small"/>
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent dividers sx={{pt: title ? 2 : 3}}>
        <Typography
          variant="body1"
          id={ariaLabel ? `${ariaLabel}-desc` : undefined}
          sx={{whiteSpace: "pre-line"}}
        >
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isProcessing && lockWhileProcessing}>
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant={confirmVariant}
          color={confirmColor}
          disabled={isProcessing}
        >
          {isProcessing ? `${confirmText}...` : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
