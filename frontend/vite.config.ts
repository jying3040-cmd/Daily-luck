import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: false,
    // 开发环境走同源代理，避免浏览器 CORS 预检问题。
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
})
