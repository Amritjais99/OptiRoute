import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'FEATURE_FILE_UPLOAD')
  const uploadPreview = process.env.VERCEL_ENV === 'preview' &&
    process.env.VERCEL_GIT_COMMIT_REF === 'feature/file-upload'
  const uploadEnabled = env.FEATURE_FILE_UPLOAD === undefined
    ? uploadPreview
    : ['1', 'true', 'on'].includes(env.FEATURE_FILE_UPLOAD.trim().toLowerCase())
  const proxyApi = uploadPreview || (process.env.VERCEL === '1' && uploadEnabled)
  return {
    plugins: [react()],
    define: {
      __FEATURE_FILE_UPLOAD__: JSON.stringify(uploadEnabled),
      __OPTIROUTE_PROXY_API__: JSON.stringify(proxyApi),
      __OPTIROUTE_PREVIEW__: JSON.stringify(uploadPreview),
    },
  }
})
