import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  /** 默认 5173；若已被占用，Vite 会自动递增（5174、5175…），请以终端里打印的 Local 为准 */
  server: {
    port: 5173,
    strictPort: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
