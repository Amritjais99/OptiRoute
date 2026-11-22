import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'FEATURE_FILE_UPLOAD')
  const uploadEnabled = ['1', 'true', 'on'].includes((env.FEATURE_FILE_UPLOAD || '').trim().toLowerCase())
  return {
    plugins: [react()],
    define: { __FEATURE_FILE_UPLOAD__: JSON.stringify(uploadEnabled) },
  }
})
