import { Box, Button, Stack, Typography, Alert } from "@mui/material";
import {
  FormProvider,
  type UseFormReturn,
  type FieldValues,
} from "react-hook-form";
import TextInput from "../../../app/shared/components/TextInput";
import { useStore } from "../../../lib/hooks/useStore";

interface JoinStepProps<T extends FieldValues = FieldValues> {
  joinForm: UseFormReturn<T>;
  onJoin: React.FormEventHandler<HTMLFormElement>;
  submitError: string | null;
  isPending: boolean;
}

const JoinStep = <T extends FieldValues>({
  joinForm,
  onJoin,
  submitError,
  isPending,
}: JoinStepProps<T>) => {
  const { uiStore } = useStore();
  return (
    <FormProvider {...joinForm}>
      <Box component="form" onSubmit={onJoin}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter an invite link to join an existing chat room.
        </Typography>
        <TextInput label="Invite link" name="invite" autoFocus />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block" }}
        >
          Invites should look like:
          https://ratchat/chat-rooms/my-cool-room/abc/join
        </Typography>
        {submitError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        )}
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button onClick={() => uiStore.backToChoose()} color="inherit">
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={isPending}
          >
            {isPending ? "Joining..." : "Join Chat Room"}
          </Button>
        </Stack>
      </Box>
    </FormProvider>
  );
};

export default JoinStep;
