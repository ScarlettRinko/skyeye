import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    assetsDir: "static",
    chunkSizeWarningLimit: 650,
  },
  server: {
    host: "127.0.0.1",
    port: 4197,
  },
  preview: {
    host: "127.0.0.1",
    port: 4197,
  },
});
