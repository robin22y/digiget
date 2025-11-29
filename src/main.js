import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { signInAnonymouslyUser } from './firebase'
import { inject } from '@vercel/analytics'

// Initialize Vercel Analytics
inject()

// Initialize anonymous authentication when app loads
// Don't block app initialization if Firebase fails
signInAnonymouslyUser().catch((error) => {
  console.error('Failed to initialize authentication:', error)
  console.warn('App will continue without Firebase features')
})

createApp(App).mount('#app')
