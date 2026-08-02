import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Las Cheladas de la Once — Sistema POS",
        short_name: "Las Cheladas",
        description: "Sistema POS para Las Cheladas de la Once",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/favicon.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "/favicon.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
      },
      workbox: {
        // Solo se cachean recursos estáticos; nunca respuestas de /api con datos sensibles.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    port: 5173,
  },
  optimizeDeps: {
    // Los paquetes @barapp/* del workspace se compilan a CommonJS (para que
    // NestJS pueda requerirlos). esbuild debe pre-empaquetarlos para que
    // el navegador pueda usar sus named exports vía ESM.
    include: ["@barapp/contracts", "@barapp/config"],
  },
});
