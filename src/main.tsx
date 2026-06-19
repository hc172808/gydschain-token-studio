import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";
import { registerServiceWorker } from "./lib/registerSW";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <App />
  </ThemeProvider>
);

// Register the service worker only in production, outside iframes/preview.
void registerServiceWorker();

