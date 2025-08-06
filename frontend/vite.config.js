import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Check if SSL certificates exist
const sslPath = path.resolve(__dirname, '../ssl')
const certPath = path.join(sslPath, 'cert.pem')
const keyPath = path.join(sslPath, 'key.pem')

const httpsConfig = fs.existsSync(certPath) && fs.existsSync(keyPath) ? {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
} : false

console.log(`🔧 Vite configuration: ${httpsConfig ? 'HTTPS enabled' : 'HTTP only'}`)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Cho phép truy cập từ các máy khác trong mạng
    port: 5173,
    strictPort: true,
    open: false, // Không tự động mở browser
    https: httpsConfig, // Enable HTTPS if certificates exist
    hmr: {
      port: httpsConfig ? 5173 : 5173,
      host: 'localhost'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    https: httpsConfig,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          socket: ['socket.io-client']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'socket.io-client']
  }
}) 