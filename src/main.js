import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { signInAnonymouslyUser } from './supabase'
import { inject } from '@vercel/analytics'

// Initialize Vercel Analytics
inject()

// Initialize anonymous authentication when app loads
// Don't block app initialization if Supabase fails
signInAnonymouslyUser().catch((error) => {
  console.error('Failed to initialize authentication:', error)
  console.warn('App will continue without Supabase features')
})

createApp(App).mount('#app')
