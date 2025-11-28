import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { signInAnonymouslyUser } from './firebase'

// Initialize anonymous authentication when app loads
signInAnonymouslyUser().catch((error) => {
  console.error('Failed to initialize authentication:', error)
})

createApp(App).mount('#app')
