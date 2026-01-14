import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { BeautyFilterProvider } from "./context/BeautyFilterContext";

const router = createRouter({ routeTree });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BeautyFilterProvider>
      <RouterProvider router={router} />
      <App />
    </BeautyFilterProvider>
  </StrictMode>
);
