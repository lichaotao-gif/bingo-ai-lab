import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  /** 本地开发固定端口；若启动失败说明 5173 已被占用，请先结束占用进程或改端口 */
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    /** 减少「改了代码但浏览器仍用旧 JS」——仍需配合硬刷新 */
    headers: {
      "Cache-Control": "no-store",
    },
  },
  /** npm run preview 固定端口 */
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
    headers: {
      "Cache-Control": "no-store",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
