// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css"; // <-- Tailwind & custom CSS

// Find the root element
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

// Render the App
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
