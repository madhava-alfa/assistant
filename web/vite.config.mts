import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(() => {
  return {
    define: {
      global: "window",
    },
    build: {
      outDir: "build",
    },
    resolve: {
      alias: {
        url: "url",
      },
    },
    plugins: [react(), viteTsconfigPaths(), tailwindcss()],
    server: {
      open: true,
      port: 3000,
    },
  };
});
