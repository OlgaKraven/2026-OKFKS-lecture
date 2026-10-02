import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
export default defineConfig({
  plugins:[react()],
  define:{'process.env.NODE_ENV':JSON.stringify('production')},
  build:{outDir:'work/pilot-standalone',copyPublicDir:false,cssCodeSplit:false,
    lib:{entry:resolve(process.cwd(),'src/lab/standalone.tsx'),name:'ReliabilityPilot',formats:['iife'],fileName:()=> 'pilot.js'},
  },
})
