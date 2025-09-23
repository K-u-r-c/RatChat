import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app/layout/styles.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { router } from "./app/router/Routes.tsx";
import { store, StoreContext } from "./lib/stores/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./app/theme";
import { PostHogProvider } from "posthog-js/react";

const queryClient = new QueryClient();
const enablePosthog =
  import.meta.env.MODE === "production" &&
  Boolean(import.meta.env.VITE_PUBLIC_POSTHOG_KEY);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {enablePosthog ? (
      <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
        options={{
          api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
          defaults: "2025-05-24",
          capture_exceptions: true,
          debug: import.meta.env.MODE === "development",
        }}
      >
        <StoreContext.Provider value={store}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
              <ReactQueryDevtools initialIsOpen={false} />
              <ToastContainer
                position="bottom-right"
                hideProgressBar
                theme="colored"
              />
              <RouterProvider router={router} />
            </ThemeProvider>
          </QueryClientProvider>
        </StoreContext.Provider>
      </PostHogProvider>
    ) : (
      <StoreContext.Provider value={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <ReactQueryDevtools initialIsOpen={false} />
            <ToastContainer
              position="bottom-right"
              hideProgressBar
              theme="colored"
            />
            <RouterProvider router={router} />
          </ThemeProvider>
        </QueryClientProvider>
      </StoreContext.Provider>
    )}
  </StrictMode>
);
