import { Box, Button, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  type FieldValues,
  FormProvider,
  type Resolver,
  useForm,
} from "react-hook-form";

type Props<TFormData extends FieldValues> = {
  title: string;
  icon: ReactNode;
  onSubmit: (data: TFormData) => Promise<void>;
  children: ReactNode;
  submitButtonText: string;
  resolver?: Resolver<TFormData>;
  reset?: boolean;
};

export default function AccountFormWrapper<TFormData extends FieldValues>({
  title,
  icon,
  onSubmit,
  children,
  submitButtonText,
  resolver,
  reset,
}: Props<TFormData>) {
  const methods = useForm<TFormData>({ resolver, mode: "onTouched" });

  const formSubmit = async (data: TFormData) => {
    await onSubmit(data);
    if (reset) methods.reset();
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        px: { xs: 0, sm: 0, md: 4 },
        pt: { xs: 2, sm: 3 },
        width: "100%",
        minHeight: { xs: "90vh", sm: "90vh", md: "auto" },
      }}
    >
      <FormProvider {...methods}>
        <Paper
          component="form"
          onSubmit={methods.handleSubmit(formSubmit)}
          sx={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "rgba(19, 19, 22, 0.8)",
            boxShadow: {
              xs: "20px 20px 40px rgba(30, 31, 33, 0.8)",
              sm: "40px 40px 60px rgba(30, 31, 33, 1)",
            },
            justifyContent: "center",
            width: {
              xs: "100%",
              sm: "400px",
              md: "480px",
              lg: "540px",
            },
            maxWidth: "540px",
            minHeight: {
              xs: "100%",
              sm: "500px",
              md: "580px",
            },
            gap: { xs: "16px", sm: "20px", md: "24px" },
            px: { xs: "24px", sm: "48px", md: "72px" },
            py: { xs: "32px", sm: "40px", md: "48px" },
            borderRadius: { xs: "16px 16px 0 0", sm: 3 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: { xs: 2, sm: 3 },
              flexDirection: "row",
              mb: { xs: 1, sm: 0 },
              color: "white",
            }}
          >
            <Typography>{icon}</Typography>
            <Typography
              sx={{
                color: "white",
                fontSize: { xs: "20px", sm: "22px", md: "24px" },
                fontWeight: "550",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            {children}
          </Box>

          <Button
            type="submit"
            disabled={
              !methods.formState.isValid || methods.formState.isSubmitting
            }
            variant="contained"
            size="large"
            fullWidth
            sx={{
              py: { xs: 1.2, sm: 1.5 },
              textTransform: "none",
              fontWeight: "bold",
              fontSize: { xs: "14px", sm: "16px" },
              backgroundColor:
                !methods.formState.isValid || methods.formState.isSubmitting
                  ? "#333"
                  : "primary",
              color:
                !methods.formState.isValid || methods.formState.isSubmitting
                  ? "#888"
                  : "white",
              borderRadius: "8px",
              "&.Mui-disabled": {
                backgroundColor: "#333",
                color: "#888",
                opacity: 1,
              },
              mt: { xs: 1, sm: 0 },
            }}
          >
            {submitButtonText}
          </Button>
        </Paper>
      </FormProvider>
    </Box>
  );
}
