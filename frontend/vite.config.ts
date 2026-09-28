import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // sockjs-client references the Node "global" object, which doesn't exist
  // in the browser; Vite (unlike Webpack) doesn't polyfill it automatically.
  define: {
    global: 'globalThis',
  },
})
