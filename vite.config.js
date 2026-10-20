import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleApiRequest } from "./server/api.mjs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "recoverbot-api",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith("/api/")) {
            next();
            return;
          }

          handleApiRequest(req, res).catch(next);
        });
      },
    },
  ],
  build: {
    target: "es2022",
  },
});
