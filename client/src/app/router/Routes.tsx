import { createBrowserRouter, Navigate } from "react-router";
import App from "../layout/App";
import HomePage from "../../features/home/HomePage";
import RequireAuth from "./RequireAuth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <RequireAuth />,
        children: [],
      },
      { path: "", element: <HomePage /> },
      { path: "*", element: <Navigate replace to="/not-found" /> },
    ],
  },
]);
