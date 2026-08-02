import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { queryClient } from "./lib/queryClient";
import { App } from "./App";
import "./index.css";

// Detecta una nueva versión desplegada y pide confirmación antes de recargar,
// para no perder lo que el usuario esté viendo a mitad de una operación.
registerSW({
  onNeedRefresh() {
    if (window.confirm("Hay una nueva versión de la aplicación disponible. ¿Actualizar ahora?")) {
      window.location.reload();
    }
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
