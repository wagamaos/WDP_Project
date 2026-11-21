import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { cpSync } from 'fs'

// Pages that still use plain <script src="js/..."> tags (home, profile, school, budget, admin, events)
// are not bundled by Vite, so copy the js/ folder into the build as-is.
function copyPlainScripts() {
  return {
    name: 'copy-plain-scripts',
    apply: 'build',
    closeBundle() {
      cpSync(resolve(__dirname, 'js'), resolve(__dirname, 'dist/js'), { recursive: true })
    }
  }
}

export default defineConfig({
  // Relative paths so the built site works on GitHub Pages (served from /WDP_Project/).
  base: './',

  plugins: [react(), copyPlainScripts()],

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
