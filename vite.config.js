import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        budget: resolve(__dirname, 'budget.html'),
        events: resolve(__dirname, 'events.html'),
        forum: resolve(__dirname, 'forum.html'),
        login: resolve(__dirname, 'login.html'),
        onboarding: resolve(__dirname, 'onboarding.html'),
        profile: resolve(__dirname, 'profile.html'),
        rewards: resolve(__dirname, 'rewards.html'),
        school: resolve(__dirname, 'school.html')
      }
    }
  }
})