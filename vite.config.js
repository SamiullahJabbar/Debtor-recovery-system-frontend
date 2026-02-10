// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//     plugins: [react()],
//     server: {
//         port: 5173,
//         proxy: {
//             '/api': {
//                 target: 'http://localhost:8001',
//                 changeOrigin: true,
//             },
//         },
//     },
// })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://44.220.50.202:8000', // backend ka URL
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
