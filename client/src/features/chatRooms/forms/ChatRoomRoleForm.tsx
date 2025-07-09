import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateChatRoomRoleSchema, type CreateChatRoomRole } from "../../../lib/schemas/chatRoomRoleSchema";
import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateChatRoomRole) => Promise<void>;
};

export default function ChatRoomRoleForm({ open, onClose, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CreateChatRoomRole>({
    resolver: zodResolver(CreateChatRoomRoleSchema),
    defaultValues: {
      name: "",
      color: "#1976d2",
      description: "",
    },
  });

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const color = watch("color");

  const onFormSubmit = async (data: CreateChatRoomRole) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add new role</DialogTitle>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 320,
          }}
        >
          <TextField
            label="Role name"
            {...register("name")}
            autoFocus
            required
            fullWidth
            sx={{ mt: 2 }}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
            <span>Color:</span>
            <input
              type="color"
              {...register("color")}
              value={color}
              onChange={e => setValue("color", e.target.value)}
              style={{ width: 40, height: 40, border: "none", background: "none", padding: 0 }}
            />
            <span style={{ fontFamily: "monospace" }}>{color}</span>
            {errors.color && (
              <span style={{ color: "red", fontSize: 12 }}>{errors.color.message}</span>
            )}
          </Box>
          <TextField
            label="Description (optional)"
            {...register("description")}
            fullWidth
            multiline
            minRows={2}
            error={!!errors.description}
            helperText={errors.description?.message}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
