<template>
  <div class="app-container">
    <div v-if="isTestMode" class="bg-yellow-500/20 border-b border-yellow-500/30 text-yellow-200 text-xs font-bold py-1 text-center uppercase tracking-widest fixed top-0 left-0 w-full z-[120]">
      Test Mode Active
    </div>
    
    <!-- 1. The New Home Page (Welcome Screen) -->
    <Transition name="fade">
      <WelcomeScreen 
        v-if="showWelcome" 
        :can-install="!!deferredPrompt"
        @start="startApp" 
        @open-info="openInfoPage"
        @install="handleInstall"
        @contact="showContactModal = true"
      />
    </Transition>

    <!-- 2. The Main App (Header + Checklist) -->
    <template v-if="!showWelcome">
      <Header 
        v-if="!showAdminDashboard" 
        @add-click="openAddModal" 
        @admin-trigger="handleAdminTrigger" 
        @manage-cards="showCardManager = true"
        @reset-day="handleResetDay"
      />
      
      <!-- Install Button and Shift Selector (Top Right) -->
      <div v-if="!showAdminDashboard" class="install-banner">
        <!-- Shift Selector (left side) -->
        <div v-if="safetyChecks.length > 0" class="shift-selector-inline">
          <div class="shift-bar bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 flex gap-1 shadow-lg backdrop-blur-sm">
            <button 
              v-for="shift in ['Day', 'SE', 'SL', 'Night']" 
              :key="shift"
              @click="currentShift = shift"
              class="flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
              :class="currentShift === shift ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'"
            >
              {{ shift }}
            </button>
          </div>
        </div>
        
        <!-- Notices/Info Button (middle) -->
        <button 
          @click="showNoticesModal = true"
          class="notices-info-button"
          :title="unreadNoticesCount > 0 ? `${unreadNoticesCount} new notice${unreadNoticesCount > 1 ? 's' : ''}` : 'View notices'"
        >
          <Bell :size="18" />
          <span v-if="unreadNoticesCount > 0" class="notice-badge">{{ unreadNoticesCount }}</span>
        </button>
        
        <!-- Install Button (right side) -->
        <button 
          class="install-banner-button"
          :class="{ 'install-available': isIOS ? true : deferredPrompt, 'install-disabled': !isIOS && !deferredPrompt }"
          @click="handleInstall"
          :title="isIOS ? 'How to install on iOS' : (deferredPrompt ? 'Install Digiget App' : 'Install not available')"
        >
          <Download :size="18" />
          <span>Install</span>
        </button>
      </div>
      
      <main v-if="!showAdminDashboard" class="main-content">

        <div v-if="showReviewScreen" class="card-stack-container">
          <ShiftReview 
            :completed-items="completedItems"
            :skipped-items="skippedItems"
            @retry="handleRetry"
            @confirm="handleConfirm"
          />
        </div>
        <div v-else-if="safetyChecks.length === 0" class="card-stack-container shift-complete-container">
          <ShiftComplete 
            :completed-items="completedItems"
            :skipped-items="skippedItems"
            :shift-type="currentShift"
            @reset="handleResetShift"
            @edit="handleEditShift"
          />
        </div>
        <div v-else class="card-stack-container">
          <SwipeCard
            v-for="(check, index) in sortedSafetyChecks"
            :key="check.id"
            :title="check.title"
            :icon="check.icon"
            :index="index"
            :color="check.color || '#27272a'"
            :style="{ zIndex: sortedSafetyChecks.length - index }"
            @swiped="handleSwipe(check.id, $event)"
          />
          <UndoButton 
            :can-undo="undoHistory.length > 0" 
            :last-action="lastUndoAction"
            @undo="handleUndo" 
          />
        </div>
      </main>

      <!-- Footer -->
      <footer v-if="!showAdminDashboard" class="app-footer">
        <div class="footer-links">
          <button class="footer-link" @click="openInfoPage('privacy')">Privacy</button>
          <span class="dot">•</span>
          <button class="footer-link" @click="openInfoPage('terms')">Terms</button>
          <span class="dot">•</span>
          <button class="footer-link" @click="openInfoPage('cookie')">Cookies</button>
          <span class="dot">•</span>
          <button class="footer-link" @click="openInfoPage('sitemap')">Site Map</button>
          <span class="dot">•</span>
          <button class="footer-link" @click="openInfoPage('faq')">FAQ</button>
          <span class="dot">•</span>
          <button class="footer-link" @click="showContactModal = true">Contact Us</button>
        </div>
      </footer>

      <AdminDashboard 
        v-if="showAdminDashboard" 
        @close="showAdminDashboard = false"
      />

      <div v-if="showAdminLogin" class="modal-backdrop" @click.self="showAdminLogin = false">
        <div class="modal-content bg-zinc-900 border border-zinc-800 p-6 max-w-xs w-full rounded-2xl">
          <h3 class="text-lg font-bold text-white mb-4">Car Park Access</h3>
          <input 
            v-model="adminPasswordInput"
            type="password" 
            placeholder="Access Code"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:border-blue-500"
            @keyup.enter="handleAdminLogin"
            autoFocus
          />
          <div class="flex gap-2">
            <button @click="showAdminLogin = false" class="flex-1 py-3 text-zinc-500 hover:text-white">Cancel</button>
            <button @click="handleAdminLogin" class="flex-1 py-3 bg-white text-black font-bold rounded-xl">Enter</button>
          </div>
        </div>
      </div>

    </template>

    <!-- Info Pages Modal (Global) -->
    <InfoPages 
      v-if="currentInfoPage" 
      :page="currentInfoPage" 
      @close="currentInfoPage = null" 
    />

    <!-- Card Manager Modal -->
    <CardManager 
      v-if="showCardManager"
      :cards="allCardsForManagement"
      @close="showCardManager = false"
      @edit="handleEditCard"
      @delete="handleDeleteCard"
      @add-new="handleAddNewFromManager"
      @reorder="handleCardReorder"
    />

    <!-- Add/Edit Card Modal -->
    <AddCardModal 
      v-if="showAddModal"
      :card="cardToEdit"
      @close="closeCardModal"
      @add="handleAddNewCard"
      @update="handleUpdateCard"
    />

    <!-- Notice Popup (only show when not on welcome screen) -->
    <NoticePopup 
      v-if="currentNotice && !showWelcome && !showNoticesModal"
      :notice="currentNotice"
      @dismiss="handleNoticeDismiss"
    />

    <!-- Notices Modal (View All Notices) -->
    <div v-if="showNoticesModal" class="modal-backdrop" @click.self="showNoticesModal = false">
      <div class="modal-content bg-zinc-900 border border-zinc-800 p-6 max-w-lg w-full rounded-2xl max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Bell :size="24" class="text-blue-400" />
            <h3 class="text-xl font-bold text-white">Notices & Updates</h3>
          </div>
          <button @click="showNoticesModal = false" class="text-zinc-500 hover:text-white">
            <X :size="24" />
          </button>
        </div>
        
        <div class="overflow-y-auto flex-1">
          <div v-if="loadingNotices" class="text-zinc-500 text-center py-8">
            Loading notices...
          </div>
          <div v-else-if="allNotices.length === 0" class="text-zinc-500 text-center py-8">
            No notices available.
          </div>
          <div v-else class="space-y-4">
            <div 
              v-for="notice in allNotices" 
              :key="notice.id"
              class="bg-zinc-950 border border-zinc-800 rounded-xl p-4"
            >
              <div class="flex items-start justify-between mb-2">
                <h4 class="font-bold text-white text-lg">{{ notice.title }}</h4>
                <span 
                  v-if="!isNoticeSeen(notice.id)"
                  class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-900/30 text-blue-400 border border-blue-900/50"
                >
                  NEW
                </span>
              </div>
              <p class="text-zinc-300 text-sm mb-3 whitespace-pre-line">{{ notice.content }}</p>
              <div v-if="notice.link" class="mb-2">
                <a 
                  :href="notice.link" 
                  target="_blank" 
                  class="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                >
                  {{ notice.link_text || notice.link }}
                  <ExternalLink :size="14" />
                </a>
              </div>
              <div class="text-xs text-zinc-600">
                {{ formatNoticeDate(notice.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Us Modal -->
    <div v-if="showContactModal" class="modal-backdrop" @click.self="showContactModal = false">
      <div class="modal-content bg-zinc-900 border border-zinc-800 p-6 max-w-md w-full rounded-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white">Contact Us</h3>
          <button @click="showContactModal = false" class="text-zinc-500 hover:text-white">
            <X :size="24" />
          </button>
        </div>
        <p class="text-zinc-400 text-sm mb-6">
          Have a suggestion for improvement or a feature request? We'd love to hear from you!
        </p>
        <form @submit.prevent="handleContactSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-zinc-500 uppercase mb-2">Your Message</label>
            <textarea
              v-model="contactMessage"
              rows="6"
              placeholder="Tell us about improvements, features, or any feedback..."
              class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
              required
            ></textarea>
          </div>
          <div class="flex gap-3">
            <button 
              type="button"
              @click="showContactModal = false" 
              class="flex-1 py-3 text-zinc-500 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="!contactMessage.trim() || isSendingContact"
              class="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSendingContact ? 'Sending...' : 'Send Message' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- iOS Install Help Modal -->
    <div v-if="showIOSInstallHelp" class="modal-backdrop" @click.self="showIOSInstallHelp = false">
      <div class="modal-content bg-zinc-900 border border-zinc-800 p-6 max-w-md w-full rounded-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white">Install Digiget on iOS</h3>
          <button @click="showIOSInstallHelp = false" class="text-zinc-500 hover:text-white">
            <X :size="24" />
          </button>
        </div>
        
        <div class="space-y-4 text-zinc-300">
          <p class="text-sm">
            To install Digiget on your iPhone or iPad, follow these steps:
          </p>
          
          <div class="space-y-3">
            <div class="flex gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                1
              </div>
              <div class="flex-1">
                <p class="text-sm">Tap the <strong class="text-white">Share</strong> button <span class="text-2xl">📤</span> at the bottom of your Safari browser</p>
              </div>
            </div>
            
            <div class="flex gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                2
              </div>
              <div class="flex-1">
                <p class="text-sm">Scroll down and tap <strong class="text-white">"Add to Home Screen"</strong></p>
              </div>
            </div>
            
            <div class="flex gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                3
              </div>
              <div class="flex-1">
                <p class="text-sm">Tap <strong class="text-white">"Add"</strong> in the top right corner</p>
              </div>
            </div>
            
            <div class="flex gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                4
              </div>
              <div class="flex-1">
                <p class="text-sm">Digiget will appear on your home screen like a regular app!</p>
              </div>
            </div>
          </div>
          
          <div class="mt-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <p class="text-xs text-zinc-400">
              <strong class="text-zinc-300">Note:</strong> Make sure you're using Safari browser. Chrome on iOS doesn't support this feature.
            </p>
          </div>
        </div>
        
        <button 
          @click="showIOSInstallHelp = false" 
          class="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>

    <!-- Cooldown Warning Modal -->
    <div v-if="showCooldownWarning" class="modal-backdrop" @click.self="handleCooldownCancel">
      <div class="modal-content bg-zinc-900 border border-zinc-800 p-6 max-w-sm w-full rounded-2xl">
        <h3 class="text-lg font-bold text-white mb-4">Starting a New Shift?</h3>
        <p class="text-zinc-400 mb-6">
          You finished a shift very recently. Digiget is designed to help you switch off. Are you starting a new shift, or just checking?
        </p>
        
        <div class="space-y-3">
          <button 
            @click="handleCooldownConfirm"
            class="w-full bg-white text-zinc-950 font-bold py-3 px-4 rounded-xl hover:bg-zinc-100 transition-colors"
          >
            I'm Starting a New Shift
          </button>
          <button 
            @click="handleCooldownCancel"
            class="w-full bg-zinc-800 text-zinc-300 font-medium py-3 px-4 rounded-xl hover:bg-zinc-700 transition-colors"
          >
            Just Checking
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import Header from './components/Header.vue'
import SwipeCard from './components/SwipeCard.vue'
import ShiftComplete from './components/ShiftComplete.vue'
import ShiftReview from './components/ShiftReview.vue'
import UndoButton from './components/UndoButton.vue'
import AddCardModal from './components/AddCardModal.vue'
import CardManager from './components/CardManager.vue'
import AdminDashboard from './components/AdminDashboard.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'
import InfoPages from './components/InfoPages.vue'
import NoticePopup from './components/NoticePopup.vue'
import { logShiftComplete, checkAdminDevice, registerAdminDevice, fetchActiveNotices, supabase } from './supabase.js'
import { inject } from '@vercel/analytics'
import { 
  Key, CreditCard, Lock, FileX, FileText, Pen, Radio, 
  Clipboard, AlertCircle, Syringe, UserPlus, Droplets, Thermometer, Download, X, Info, Bell, ExternalLink
} from 'lucide-vue-next'

const iconMap = {
  Key, CreditCard, Lock, FileX, FileText, Pen, Radio,
  Clipboard, AlertCircle, Syringe, UserPlus, Droplets, Thermometer
}

const showAddModal = ref(false)
const showCardManager = ref(false)
const showAdminLogin = ref(false)
const showAdminDashboard = ref(false)
const adminPasswordInput = ref('')
const showWelcome = ref(true)
const currentInfoPage = ref(null)
const showContactModal = ref(false)
const contactMessage = ref('')
const isSendingContact = ref(false)
const deferredPrompt = ref(null)
const cardToEdit = ref(null)
const currentShift = ref('Day') // Store the selected shift type
const currentNotice = ref(null) // Current notice to display
const showNoticesModal = ref(false) // Show notices modal
const allNotices = ref([]) // All active notices for the modal
const loadingNotices = ref(false) // Loading state for notices

// --- PWA Install Logic & Update Checking ---
onMounted(() => {
  // Check if this device is already trusted as admin
  checkAdminDevice().then(isAdmin => {
    isAdminDevice.value = isAdmin
  })
  
  // Check Test Mode
  isTestMode.value = localStorage.getItem('digiget_test_mode') === 'true'
  
  // Register service worker update handler
  if ('serviceWorker' in navigator) {
    let refreshing = false
    
    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      // Reload page when new service worker takes control
      window.location.reload()
    })
    
    // Check for updates periodically (every 5 minutes)
    setInterval(() => {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.update()
        }
      })
    }, 5 * 60 * 1000) // 5 minutes
  }
  
  // Detect iOS
  const userAgent = window.navigator.userAgent.toLowerCase()
  isIOS.value = /iphone|ipad|ipod/.test(userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  
  // Listen for the beforeinstallprompt event (not available on iOS)
  window.addEventListener('beforeinstallprompt', (e) => {
    if (import.meta.env.DEV) {
      console.log('✅ PWA install prompt available!')
    }
    e.preventDefault()
    deferredPrompt.value = e
  })

  // Debug: Check if service worker is registered
  if ('serviceWorker' in navigator && import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('Service Workers registered:', registrations.length)
      registrations.forEach(reg => {
        console.log('SW scope:', reg.scope, 'active:', !!reg.active)
      })
    })
  }

  // Debug: Check manifest (only in production)
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    fetch('/manifest.webmanifest')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(manifest => {
        if (import.meta.env.DEV) {
          console.log('✅ Manifest loaded:', manifest)
        }
      })
      .catch(err => {
        // Silently fail in development, only log in production
        if (import.meta.env.PROD) {
          console.error('❌ Manifest error:', err)
        }
      })
  }
})

const handleInstall = async () => {
  // Show iOS help modal for iOS users
  if (isIOS.value) {
    showIOSInstallHelp.value = true
    return
  }
  
  // Regular install flow for other platforms
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    deferredPrompt.value = null
  }
}

// --- App Flow (Persistent Visit Logic) ---
const checkVisitHistory = () => {
  const hasVisited = localStorage.getItem('digiget-visited')
  if (hasVisited) {
    // Returning user: Skip welcome, go straight to app
    showWelcome.value = false
    // Check for notices after app loads
    setTimeout(() => {
      checkForNotices()
      // Also load notices for the badge count
      loadAllNotices()
    }, 1500)
  } else {
    // New user: Show welcome screen (which has its own selector)
    showWelcome.value = true
  }
}

// Called by Welcome Screen (New Users)
const startApp = (selectedShift) => {
  currentShift.value = selectedShift || 'Day'
  showWelcome.value = false
  localStorage.setItem('digiget-visited', 'true')
  // Check for notices after starting the app
  setTimeout(() => {
    checkForNotices()
    // Also load notices for the badge count
    loadAllNotices()
  }, 500)
}

const openInfoPage = (pageName) => {
  currentInfoPage.value = pageName
}

// --- Admin Logic ---
// Handle admin trigger (from secret click)
const handleAdminTrigger = () => {
  if (isAdminDevice.value) {
    // Recognized device? Go straight in.
    showAdminDashboard.value = true
  } else {
    // Stranger? Ask for password.
    showAdminLogin.value = true
  }
}

const handleAdminLogin = () => {
  if (adminPasswordInput.value === 'Rncdm@2025') {
    // Success!
    showAdminDashboard.value = true
    showAdminLogin.value = false
    adminPasswordInput.value = ''
    
    // Ask before tagging device as admin
    if (!isAdminDevice.value) {
      const shouldTag = confirm('Would you like to trust this device? You won\'t need to enter the password next time.')
      if (shouldTag) {
        registerAdminDevice().then(result => {
          if (result.success) {
            isAdminDevice.value = true
          }
        })
      }
    }
  } else {
    alert("Incorrect Access Code")
    showAdminLogin.value = false
    adminPasswordInput.value = ''
  }
}

// --- Data Logic ---
const getFreshChecks = () => [
  { id: 1, title: 'Did I return my keys?', iconName: 'Key', icon: Key, color: '#27272a' },
  { id: 2, title: 'Did I remove my ID badge?', iconName: 'CreditCard', icon: CreditCard, color: '#27272a' },
  { id: 3, title: 'Did I lock the controlled drugs?', iconName: 'Lock', icon: Lock, color: '#27272a' },
  { id: 4, title: 'Did I sign all medications?', iconName: 'Pen', icon: Pen, color: '#27272a' },
  { id: 5, title: 'Did I complete handover?', iconName: 'Clipboard', icon: Clipboard, color: '#27272a' },
  { id: 6, title: 'Did I document everything?', iconName: 'FileText', icon: FileText, color: '#27272a' },
  { id: 7, title: 'Did I complete skin checks?', iconName: 'AlertCircle', icon: AlertCircle, color: '#27272a' },
  { id: 8, title: 'Did I do cannula care?', iconName: 'Syringe', icon: Syringe, color: '#27272a' },
  { id: 9, title: 'Did I do catheter care?', iconName: 'Droplets', icon: Droplets, color: '#27272a' },
  { id: 10, title: 'Did I do central line care?', iconName: 'Syringe', icon: Syringe, color: '#27272a' },
]

const defaultChecks = ref([])
const customChecks = ref([])
const safetyChecks = ref([])
const completedItems = ref([])
const skippedItems = ref([])
const undoHistory = ref([])
const deletedCardIds = ref(new Set()) // Track deleted card IDs to prevent them from reappearing

const restoreIcons = (items) => {
  return items.map(item => ({
    ...item,
    icon: item.iconName ? iconMap[item.iconName] : item.icon,
    color: item.color || '#27272a', // Ensure color is always present
    repeatDays: item.repeatDays || null, // Preserve repeatDays
    position: item.position !== undefined ? item.position : undefined // Preserve position
  }))
}

// Helper function to check if a card should appear today based on repeatDays
const shouldCardAppearToday = (card) => {
  // If no repeatDays specified, show every day
  if (!card.repeatDays || card.repeatDays.length === 0) {
    return true
  }
  
  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay()
  
  // Check if today is in the repeatDays array
  return card.repeatDays.includes(today)
}

const loadState = () => {
  try {
    const saved = localStorage.getItem('digiget-state')
    const freshDefaults = getFreshChecks()
    
    if (saved) {
      const state = JSON.parse(saved)
      customChecks.value = restoreIcons(state.customChecks || [])
      
      // Load deleted card IDs
      if (state.deletedCardIds && Array.isArray(state.deletedCardIds)) {
        deletedCardIds.value = new Set(state.deletedCardIds)
      } else {
        deletedCardIds.value = new Set()
      }
      
      if (state.safetyChecks) {
        const savedChecks = restoreIcons(state.safetyChecks)
        // Merge new default cards with saved state
        // Add any new default cards that don't exist in saved state
        // But exclude any that have been deleted
        const savedIds = new Set(savedChecks.map(c => c.id))
        const newDefaults = freshDefaults.filter(d => 
          !savedIds.has(d.id) && !deletedCardIds.value.has(d.id)
        )
        // Filter all cards by repeatDays - only show cards that should appear today
        const allCards = [...savedChecks, ...newDefaults]
        safetyChecks.value = allCards.filter(card => shouldCardAppearToday(card))
      } else {
        // Filter out deleted default cards
        const activeDefaults = freshDefaults.filter(d => !deletedCardIds.value.has(d.id))
        // Filter all cards by repeatDays - only show cards that should appear today
        const allCards = [...activeDefaults, ...customChecks.value]
        safetyChecks.value = allCards.filter(card => shouldCardAppearToday(card))
      }
      
      completedItems.value = restoreIcons(state.completedItems || [])
      skippedItems.value = restoreIcons(state.skippedItems || [])
      undoHistory.value = state.undoHistory ? state.undoHistory.map(item => ({
          ...item,
          check: restoreIcons([item.check])[0]
        })) : []
        
    } else {
      customChecks.value = []
      deletedCardIds.value = new Set()
      // Filter defaults based on repeatDays (though defaults don't have repeatDays, so all will show)
      safetyChecks.value = freshDefaults.filter(card => shouldCardAppearToday(card))
    }
  } catch (e) {
    const freshDefaults = getFreshChecks()
    safetyChecks.value = freshDefaults.filter(card => shouldCardAppearToday(card))
    deletedCardIds.value = new Set()
  }
}

const saveState = () => {
  const serialize = (items) => items.map(item => ({
    ...item,
    iconName: item.iconName || Object.keys(iconMap).find(key => iconMap[key] === item.icon) || 'Clipboard',
    icon: undefined,
    repeatDays: item.repeatDays || null, // Preserve repeatDays
    position: item.position !== undefined ? item.position : undefined // Preserve position
  }))

  const state = {
    customChecks: serialize(customChecks.value),
    safetyChecks: serialize(safetyChecks.value),
    completedItems: serialize(completedItems.value),
    skippedItems: serialize(skippedItems.value),
    undoHistory: undoHistory.value.map(item => ({
      ...item,
      check: serialize([item.check])[0]
    })),
    deletedCardIds: Array.from(deletedCardIds.value) // Save deleted card IDs
  }
  localStorage.setItem('digiget-state', JSON.stringify(state))
}

// Init
checkVisitHistory() // Check if user has visited before
loadState()

watch([safetyChecks, customChecks, completedItems, skippedItems, undoHistory, deletedCardIds], () => {
  saveState()
}, { deep: true })

watch(safetyChecks, async (newChecks) => {
  if (newChecks.length === 0) {
    // If there are skipped items, show review screen instead of logging immediately
    if (skippedItems.value.length > 0) {
      showReviewScreen.value = true
      return
    }
    
    // If no skipped items, log immediately (existing flow)
    if (completedItems.value.length > 0) {
      try {
        // Ensure test mode is up-to-date from localStorage
        const currentTestMode = localStorage.getItem('digiget_test_mode') === 'true'
        isTestMode.value = currentTestMode
        
        const itemsChecked = completedItems.value.length
        const skippedTitles = skippedItems.value.map(item => item.title)
        // Pass the currentShift.value and isTestMode to Supabase!
        if (import.meta.env.DEV) {
          console.log('🔄 Starting Supabase save process...', {
            isTestMode: isTestMode.value,
            currentTestMode: currentTestMode,
            testModeFromStorage: localStorage.getItem('digiget_test_mode')
          })
        }
        const result = await logShiftComplete(itemsChecked, skippedTitles, currentShift.value, isTestMode.value)
        
        if (result) {
          if (import.meta.env.DEV) {
            console.log('✅ Shift completion logged successfully to Supabase. Document ID:', result)
          }
        } else {
          console.warn('⚠️ Shift completion not logged - Supabase not configured. Check console for details.')
        }
        
        // Store the completion timestamp for cooldown check
        localStorage.setItem('digiget-last-completion', Date.now().toString())
      } catch (e) { 
        console.error('❌ Failed to log shift completion:', e) 
      }
    }
  }
}, { deep: true })

// Haptic feedback helper
const vibrate = (pattern = [50]) => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch (e) {
      // Silently fail if vibration is not supported or blocked
    }
  }
}

const handleSwipe = (checkId, direction) => {
  const swipedCheck = safetyChecks.value.find(c => c.id === checkId)
  if (!swipedCheck) {
    // Card not found in safetyChecks - might have already been swiped
    // This can happen if the swipe event fires multiple times or there's a race condition
    if (import.meta.env.DEV) {
      console.warn('Swipe attempted on card not in safetyChecks:', checkId)
    }
    return
  }

  // If card is in safetyChecks, it's a valid swipe - allow it
  // Only prevent if somehow the card is already in both arrays (shouldn't happen, but safety check)
  const alreadyCompleted = completedItems.value.some(item => item.id === checkId)
  const alreadySkipped = skippedItems.value.some(item => item.id === checkId)
  
  // If card exists in both arrays (data corruption), clean it up first
  if (alreadyCompleted && alreadySkipped) {
    if (import.meta.env.DEV) {
      console.warn('Card found in both arrays, cleaning up:', checkId)
    }
    completedItems.value = completedItems.value.filter(item => item.id !== checkId)
    skippedItems.value = skippedItems.value.filter(item => item.id !== checkId)
  }
  // If card exists in the target array but is still in safetyChecks, remove from array first
  else if ((direction === 'right' && alreadyCompleted) || (direction === 'left' && alreadySkipped)) {
    if (import.meta.env.DEV) {
      console.warn('Card found in target array but still in safetyChecks, cleaning up:', checkId)
    }
    if (direction === 'right') {
      completedItems.value = completedItems.value.filter(item => item.id !== checkId)
    } else {
      skippedItems.value = skippedItems.value.filter(item => item.id !== checkId)
    }
  }

  undoHistory.value.push({
    check: swipedCheck,
    direction,
    originalIndex: safetyChecks.value.findIndex(c => c.id === checkId)
  })

  if (direction === 'right') completedItems.value.push(swipedCheck)
  else skippedItems.value.push(swipedCheck)

  safetyChecks.value = safetyChecks.value.filter(c => c.id !== checkId)
  
  // Haptic feedback when checklist is completed (last card swiped)
  if (safetyChecks.value.length === 0) {
    // Celebration pattern: short, pause, medium, pause, long
    vibrate([50, 100, 100, 100, 200])
  }
}

const handleUndo = () => {
  if (undoHistory.value.length === 0) return
  const lastAction = undoHistory.value.pop()
  const { check, direction, originalIndex } = lastAction

  if (direction === 'right') completedItems.value = completedItems.value.filter(i => i.id !== check.id)
  else skippedItems.value = skippedItems.value.filter(i => i.id !== check.id)

  const insertIndex = Math.min(originalIndex, safetyChecks.value.length)
  safetyChecks.value.splice(insertIndex, 0, check)
}

const handleContactSubmit = () => {
  if (!contactMessage.value.trim()) return
  
  isSendingContact.value = true
  
  // Encode the email address so it's not visible in the UI
  const email = 'hello@digiget.uk'
  const subject = encodeURIComponent('Digiget Feedback / Feature Request')
  const body = encodeURIComponent(contactMessage.value.trim())
  
  // Create mailto link (email is encoded, not visible in UI)
  const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`
  
  // Open email client
  window.location.href = mailtoLink
  
  // Reset form after a delay
  setTimeout(() => {
    contactMessage.value = ''
    isSendingContact.value = false
    showContactModal.value = false
    // Show success message (optional)
    alert('Your email client should open. If it doesn\'t, please email us directly.')
  }, 500)
}

const handleResetDay = () => {
  if (confirm('Reset today\'s entry? This will clear today\'s progress only. Your custom cards and history will be preserved.')) {
    // Reset only today's session - preserves custom cards and historical data
    // Get all cards (including edited defaults that are now in customChecks)
    // Start with fresh defaults, but replace with custom versions if they exist
    // But exclude deleted cards
    const freshDefaults = getFreshChecks()
    const allCards = freshDefaults
      .filter(defaultCard => !deletedCardIds.value.has(defaultCard.id)) // Exclude deleted defaults
      .map(defaultCard => {
        // Check if this default card has been customized
        const customVersion = customChecks.value.find(c => 
          c.id === defaultCard.id || 
          (c.title === defaultCard.title && c.iconName === defaultCard.iconName)
        )
        return customVersion || defaultCard
      })
    
    // Add any additional custom cards that aren't defaults (and aren't deleted)
    const defaultTitles = new Set(freshDefaults.map(c => c.title))
    const additionalCustoms = customChecks.value.filter(c => 
      !defaultTitles.has(c.title) && 
      !freshDefaults.some(d => d.id === c.id) &&
      !deletedCardIds.value.has(c.id) // Exclude deleted custom cards
    )
    
    // Reset only current session data (today's entry)
    // Note: customChecks is preserved (user's custom cards)
    // Note: Historical Supabase logs are preserved (already saved separately)
    // Filter all cards by repeatDays - only show cards that should appear today
    const allAvailableCards = [...allCards, ...additionalCustoms]
    safetyChecks.value = allAvailableCards.filter(card => shouldCardAppearToday(card))
    completedItems.value = []
    skippedItems.value = []
    undoHistory.value = []
    window.scrollTo(0, 0)
  }
}

const showCooldownWarning = ref(false)
const showReviewScreen = ref(false)
const showIOSInstallHelp = ref(false)

// Detect iOS
const isIOS = ref(false)

// Admin Device Tagging
const isAdminDevice = ref(false)

// Test Mode
const isTestMode = ref(false)

const handleResetShift = () => {
  // Check if last completion was less than 4 hours ago
  const lastCompletion = localStorage.getItem('digiget-last-completion')
  if (lastCompletion) {
    const lastCompletionTime = parseInt(lastCompletion)
    const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000) // 4 hours in milliseconds
    
    if (lastCompletionTime > fourHoursAgo) {
      // Show cooldown warning
      showCooldownWarning.value = true
      return
    }
  }
  
  // No cooldown or more than 4 hours passed, proceed normally
  handleResetDay()
}

const handleCooldownConfirm = () => {
  showCooldownWarning.value = false
  handleResetDay()
}

const handleCooldownCancel = () => {
  showCooldownWarning.value = false
  // Stay on the green screen (do nothing)
}

// Safety Review Handlers
const handleRetry = () => {
  // Move skipped items back to safetyChecks
  // Restore icons for skipped items before adding them back
  const skippedToRestore = restoreIcons([...skippedItems.value])
  // Filter by repeatDays - only include cards that should appear today
  const filteredSkipped = skippedToRestore.filter(card => shouldCardAppearToday(card))
  safetyChecks.value = [...filteredSkipped, ...safetyChecks.value.filter(card => shouldCardAppearToday(card))]
  skippedItems.value = []
  showReviewScreen.value = false
}

const handleConfirm = async () => {
  // Log the shift as-is (with skips) and proceed to success screen
  showReviewScreen.value = false
  
  try {
    // Ensure test mode is up-to-date from localStorage
    const currentTestMode = localStorage.getItem('digiget_test_mode') === 'true'
    isTestMode.value = currentTestMode
    
    const itemsChecked = completedItems.value.length
    const skippedTitles = skippedItems.value.map(item => item.title)
    // Pass the currentShift.value and isTestMode to Supabase!
    if (import.meta.env.DEV) {
      console.log('🔄 Starting Supabase save process (from review screen)...', {
        isTestMode: isTestMode.value,
        currentTestMode: currentTestMode,
        testModeFromStorage: localStorage.getItem('digiget_test_mode')
      })
    }
    const result = await logShiftComplete(itemsChecked, skippedTitles, currentShift.value, isTestMode.value)
    
    if (result) {
      console.log('✅ Shift completion logged successfully to Supabase. Document ID:', result)
    } else {
      console.warn('⚠️ Shift completion not logged - Supabase not configured. Check console for details.')
    }
    
    // Store the completion timestamp for cooldown check
    localStorage.setItem('digiget-last-completion', Date.now().toString())
  } catch (e) { 
    console.error('❌ Failed to log shift completion:', e) 
  }
}

const handleEditShift = () => {
  // Re-open the checklist for editing after confirmation
  // Restore all cards from completed/skipped back to safetyChecks
  // This allows the user to edit their choices
  
  if (import.meta.env.DEV) {
    console.log('handleEditShift called')
    console.log('completedItems:', completedItems.value.length)
    console.log('skippedItems:', skippedItems.value.length)
  }
  
  // Combine completed and skipped items
  const allSwipedCards = [...completedItems.value, ...skippedItems.value]
  
  if (import.meta.env.DEV) {
    console.log('All swiped cards:', allSwipedCards.length)
    if (allSwipedCards.length > 0) {
      console.log('Sample card:', allSwipedCards[0])
    }
  }
  
  // Ensure icons are properly restored and all properties are present
  // Also filter out any deleted cards (shouldn't happen, but safety check)
  const restoredCards = restoreIcons(allSwipedCards)
    .filter(card => !deletedCardIds.value.has(card.id)) // Exclude deleted cards
    .map(card => {
    // Find the icon if it's missing
    let icon = card.icon
    if (!icon && card.iconName) {
      icon = iconMap[card.iconName]
    }
    if (!icon) {
      // Try to find icon by matching existing icon component
      const iconKey = Object.keys(iconMap).find(key => iconMap[key] === card.icon)
      icon = iconKey ? iconMap[iconKey] : iconMap.Clipboard
    }
    
    return {
      ...card,
      // Ensure all required properties exist
      id: card.id || Date.now() + Math.random(), // Fallback ID if missing
      title: card.title || 'Unknown',
      iconName: card.iconName || Object.keys(iconMap).find(key => iconMap[key] === icon) || 'Clipboard',
      icon: icon,
      color: card.color || '#27272a'
    }
  })
  
  if (import.meta.env.DEV) {
    console.log('Restored cards:', restoredCards.length)
    if (restoredCards.length > 0) {
      console.log('Sample restored card:', restoredCards[0])
    }
  }
  
  // If no cards to restore, something went wrong - restore from defaults
  if (restoredCards.length === 0) {
    console.warn('No cards to restore! Restoring from defaults...')
    const freshDefaults = getFreshChecks()
    const allDefaultCards = freshDefaults
      .filter(defaultCard => !deletedCardIds.value.has(defaultCard.id)) // Exclude deleted defaults
      .map(defaultCard => {
        const customVersion = customChecks.value.find(c => 
          c.id === defaultCard.id || 
          (c.title === defaultCard.title && c.iconName === defaultCard.iconName)
        )
        return customVersion || defaultCard
      })
    const defaultTitles = new Set(freshDefaults.map(c => c.title))
    const additionalCustoms = customChecks.value.filter(c => 
      !defaultTitles.has(c.title) && 
      !freshDefaults.some(d => d.id === c.id) &&
      !deletedCardIds.value.has(c.id) // Exclude deleted custom cards
    )
    // Filter by repeatDays - only show cards that should appear today
    const allCards = [...allDefaultCards, ...additionalCustoms]
    safetyChecks.value = allCards.filter(card => shouldCardAppearToday(card))
  } else {
    // Restore the cards to safetyChecks, but filter by repeatDays
    safetyChecks.value = restoredCards.filter(card => shouldCardAppearToday(card))
  }
  
  // Clear completed/skipped and undo history
  completedItems.value = []
  skippedItems.value = []
  undoHistory.value = []
  
  // Force a save to localStorage to persist the restored state
  saveState()
  
  window.scrollTo(0, 0)
  
  if (import.meta.env.DEV) {
    console.log('Edit shift complete. safetyChecks now has', safetyChecks.value.length, 'cards')
  }
}

// Get all cards for management (combine default and custom, but use current state)
// Computed property to get the last undo action direction
const lastUndoAction = computed(() => {
  if (undoHistory.value.length === 0) return null
  const lastItem = undoHistory.value[undoHistory.value.length - 1]
  return lastItem?.direction || null
})

// Computed property to sort safetyChecks by position
const sortedSafetyChecks = computed(() => {
  const checks = [...safetyChecks.value]
  return checks.sort((a, b) => {
    // If both have position, sort by position
    if (a.position !== undefined && b.position !== undefined) {
      return a.position - b.position
    }
    // If only one has position, prioritize it
    if (a.position !== undefined) return -1
    if (b.position !== undefined) return 1
    // Fallback: maintain original order (by id as tiebreaker)
    return a.id - b.id
  })
})

const allCardsForManagement = computed(() => {
  // Get all unique cards - always include defaults, plus any custom/edited versions
  // But exclude deleted cards
  const allCardIds = new Set()
  const allCards = []
  
  // Start with default cards - these are always available for editing (unless deleted)
  const defaultCards = getFreshChecks()
  defaultCards.forEach(card => {
    // Skip if this card has been deleted
    if (deletedCardIds.value.has(card.id)) {
      return
    }
    
    // Check if there's a custom/edited version of this default card
    const customVersion = customChecks.value.find(c => 
      c.id === card.id || 
      (c.title === card.title && c.iconName === card.iconName)
    )
    
    // Use custom version if it exists, otherwise use default
    const cardToAdd = customVersion || card
    if (!allCardIds.has(cardToAdd.id) && !deletedCardIds.value.has(cardToAdd.id)) {
      allCardIds.add(cardToAdd.id)
      allCards.push(cardToAdd)
    }
  })
  
  // Add any additional custom cards that aren't defaults (and aren't deleted)
  customChecks.value.forEach(card => {
    const isDefault = defaultCards.some(d => d.id === card.id)
    if (!isDefault && !allCardIds.has(card.id) && !deletedCardIds.value.has(card.id)) {
      allCardIds.add(card.id)
      allCards.push(card)
    }
  })
  
  // Add cards from current safety checks (in case they're not in defaults or custom)
  // But exclude deleted ones
  safetyChecks.value.forEach(card => {
    if (!allCardIds.has(card.id) && !deletedCardIds.value.has(card.id)) {
      allCardIds.add(card.id)
      allCards.push(card)
    }
  })
  
  // Don't include cards from completed/skipped if they've been deleted
  // They should only appear if they're still active cards
  
  // Sort by position if available, otherwise by title
  return allCards.sort((a, b) => {
    // If both have position, sort by position
    if (a.position !== undefined && b.position !== undefined) {
      return a.position - b.position
    }
    // If only one has position, prioritize it
    if (a.position !== undefined) return -1
    if (b.position !== undefined) return 1
    // Fallback to title sorting
    return a.title.localeCompare(b.title)
  })
})

const openAddModal = () => {
  cardToEdit.value = null
  showAddModal.value = true
}

const closeCardModal = () => {
  showAddModal.value = false
  cardToEdit.value = null
}

const handleAddNewFromManager = () => {
  showCardManager.value = false
  openAddModal()
}

const handleEditCard = (card) => {
  cardToEdit.value = card
  showCardManager.value = false
  showAddModal.value = true
}

const handleDeleteCard = (card) => {
  // Mark card as deleted so it doesn't reappear
  deletedCardIds.value.add(card.id)
  
  // Remove from custom checks if it's there
  customChecks.value = customChecks.value.filter(c => c.id !== card.id)
  
  // Remove from safety checks
  safetyChecks.value = safetyChecks.value.filter(c => c.id !== card.id)
  
  // Remove from completed items
  completedItems.value = completedItems.value.filter(c => c.id !== card.id)
  
  // Remove from skipped items
  skippedItems.value = skippedItems.value.filter(c => c.id !== card.id)
  
  // Remove from undo history
  undoHistory.value = undoHistory.value.filter(item => item.check.id !== card.id)
}

const handleCardReorder = ({ card, newIndex, oldIndex }) => {
  // Get all cards in current management order
  const allCards = [...allCardsForManagement.value]
  
  // Remove the dragged card from its old position
  const draggedCard = allCards.splice(oldIndex, 1)[0]
  
  // Insert it at the new position
  allCards.splice(newIndex, 0, draggedCard)
  
  // Update positions for all cards based on their new order
  allCards.forEach((c, index) => {
    c.position = index
    
    // Update position in customChecks if it exists there
    const customCard = customChecks.value.find(cc => cc.id === c.id)
    if (customCard) {
      customCard.position = index
    } else if (c.id === card.id) {
      // It's a default card being reordered, create a custom version to store position
      const defaultCards = getFreshChecks()
      const isDefault = defaultCards.some(d => d.id === c.id)
      if (isDefault) {
        customChecks.value.push({
          ...c,
          position: index
        })
      }
    }
    
    // Update position in safetyChecks if it exists there
    const safetyCard = safetyChecks.value.find(sc => sc.id === c.id)
    if (safetyCard) {
      safetyCard.position = index
    }
  })
  
  // Re-sort safetyChecks by position
  safetyChecks.value.sort((a, b) => {
    const posA = a.position !== undefined ? a.position : 999
    const posB = b.position !== undefined ? b.position : 999
    return posA - posB
  })
}

const handleAddNewCard = ({ title, iconName, color, repeatDays }) => {
  // Get the highest position from existing cards, or start at 0
  const maxPosition = Math.max(
    ...allCardsForManagement.value.map(c => c.position !== undefined ? c.position : -1),
    -1
  )
  
  const newCard = {
    id: Date.now(),
    title: title,
    iconName: iconName,
    icon: iconMap[iconName],
    color: color,
    repeatDays: repeatDays || null,
    position: maxPosition + 1 // Add at the end
  }
  customChecks.value.push(newCard)
  
  // Only add to safetyChecks if it should appear today
  if (shouldCardAppearToday(newCard)) {
    safetyChecks.value.push(newCard) // Add at the end to maintain position order
  }
  closeCardModal()
}

const handleUpdateCard = ({ id, title, iconName, color, repeatDays }) => {
  const updatedCard = {
    id: id,
    title: title,
    iconName: iconName,
    icon: iconMap[iconName],
    color: color,
    repeatDays: repeatDays || null
  }
  
  // Update in custom checks if it exists there
  const customIndex = customChecks.value.findIndex(c => c.id === id)
  if (customIndex !== -1) {
    customChecks.value[customIndex] = updatedCard
  } else {
    // If it's a default card, add it to custom checks so it persists
    customChecks.value.push(updatedCard)
  }
  
  // Update in safetyChecks if it exists there
  const safetyIndex = safetyChecks.value.findIndex(c => c.id === id)
  if (safetyIndex !== -1) {
    // If card should appear today, update it; otherwise remove it
    if (shouldCardAppearToday(updatedCard)) {
      safetyChecks.value[safetyIndex] = updatedCard
    } else {
      safetyChecks.value.splice(safetyIndex, 1)
    }
  } else {
    // If card should appear today and not in safetyChecks, add it
    if (shouldCardAppearToday(updatedCard)) {
      safetyChecks.value.unshift(updatedCard)
    }
  }
  
  // Update in completed items
  const completedIndex = completedItems.value.findIndex(c => c.id === id)
  if (completedIndex !== -1) {
    completedItems.value[completedIndex] = updatedCard
  }
  
  // Update in skipped items
  const skippedIndex = skippedItems.value.findIndex(c => c.id === id)
  if (skippedIndex !== -1) {
    skippedItems.value[skippedIndex] = updatedCard
  }
  
  // Update in undo history
  const undoIndex = undoHistory.value.findIndex(item => item.check.id === id)
  if (undoIndex !== -1) {
    undoHistory.value[undoIndex].check = updatedCard
  }
  
  closeCardModal()
}

// --- Notice Logic ---
const checkForNotices = async () => {
  if (!supabase) {
    if (import.meta.env.DEV) {
      console.log('⚠️ Notices: Supabase not initialized')
    }
    return
  }

  try {
    if (import.meta.env.DEV) {
      console.log('🔔 Checking for notices...')
    }
    
    const activeNotices = await fetchActiveNotices()
    
    if (import.meta.env.DEV) {
      console.log('📋 Active notices:', activeNotices)
    }
    
    if (!activeNotices || activeNotices.length === 0) {
      if (import.meta.env.DEV) {
        console.log('ℹ️ No active notices found')
      }
      return
    }

    // Get list of seen notice IDs from localStorage
    const seenNotices = JSON.parse(localStorage.getItem('digiget_seen_notices') || '[]')
    
    if (import.meta.env.DEV) {
      console.log('👀 Seen notices:', seenNotices)
    }
    
    // Find the first notice that hasn't been seen (sorted by priority)
    // Convert notice.id to string for comparison since localStorage stores strings
    const unseenNotice = activeNotices.find(notice => {
      const noticeIdStr = String(notice.id)
      return !seenNotices.includes(noticeIdStr) && !seenNotices.includes(notice.id)
    })
    
    if (unseenNotice) {
      if (import.meta.env.DEV) {
        console.log('✅ Found unseen notice:', unseenNotice)
      }
      // Show the notice after a short delay to let the app load
      setTimeout(() => {
        currentNotice.value = unseenNotice
        if (import.meta.env.DEV) {
          console.log('🎯 Displaying notice popup')
        }
      }, 1000)
    } else {
      if (import.meta.env.DEV) {
        console.log('ℹ️ All notices have been seen')
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Error checking for notices:', error)
    }
  }
}

const handleNoticeDismiss = () => {
  if (currentNotice.value?.id) {
    markNoticeAsSeen(currentNotice.value.id)
  }
  currentNotice.value = null
  // Re-check for more notices after dismissing (in case there are multiple)
  setTimeout(() => {
    checkForNotices()
  }, 500)
}

// Helper function to mark notice as seen
const markNoticeAsSeen = (noticeId) => {
  const seenNotices = JSON.parse(localStorage.getItem('digiget_seen_notices') || '[]')
  const noticeIdStr = String(noticeId)
  // Check both string and number format for compatibility
  if (!seenNotices.includes(noticeIdStr) && !seenNotices.includes(noticeId)) {
    seenNotices.push(noticeIdStr) // Store as string for consistency
    localStorage.setItem('digiget_seen_notices', JSON.stringify(seenNotices))
    if (import.meta.env.DEV) {
      console.log('✅ Marked notice as seen:', noticeIdStr)
    }
  }
}

// Check if notice has been seen
const isNoticeSeen = (noticeId) => {
  const seenNotices = JSON.parse(localStorage.getItem('digiget_seen_notices') || '[]')
  const noticeIdStr = String(noticeId)
  return seenNotices.includes(noticeIdStr) || seenNotices.includes(noticeId)
}

// Get count of unread notices
const unreadNoticesCount = computed(() => {
  if (allNotices.value.length === 0) return 0
  const seenNotices = JSON.parse(localStorage.getItem('digiget_seen_notices') || '[]')
  return allNotices.value.filter(notice => {
    const noticeIdStr = String(notice.id)
    return !seenNotices.includes(noticeIdStr) && !seenNotices.includes(notice.id)
  }).length
})

// Load all notices for the modal
const loadAllNotices = async () => {
  if (!supabase) return
  
  loadingNotices.value = true
  try {
    const notices = await fetchActiveNotices()
    allNotices.value = notices || []
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error loading notices for modal:', error)
    }
    allNotices.value = []
  } finally {
    loadingNotices.value = false
  }
}

// Watch for modal opening to load notices
watch(showNoticesModal, (isOpen) => {
  if (isOpen) {
    loadAllNotices()
  }
})

// Format notice date
const formatNoticeDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.app-container {
  @apply h-[100dvh] w-screen flex flex-col bg-zinc-950 overflow-hidden fixed inset-0;
}

/* On mobile, allow scrolling to see footer */
@media (max-width: 768px) {
  .app-container {
    overflow-y: auto;
    overflow-x: hidden;
  }
}

.main-content {
  @apply flex-1 flex flex-col items-center justify-center p-6;
  /* Allow scrolling when content is too tall */
  overflow-y: auto;
  overflow-x: hidden;
  /* Add bottom padding to ensure footer is visible */
  padding-bottom: 80px;
}

.shift-selector-wrapper {
  @apply w-full flex flex-col items-center;
}

.shift-bar {
  @apply w-full;
}

.card-stack-container {
  @apply relative w-full max-w-sm h-full max-h-[600px] flex items-center justify-center;
  perspective: 1000px;
}

/* Special styling for ShiftComplete container - don't take full height */
.shift-complete-container {
  @apply h-auto max-h-none;
  /* Allow content to flow naturally and show footer */
  flex: 0 1 auto;
  min-height: auto;
}

.modal-backdrop {
  @apply fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4;
}

/* Install Banner (Top Right) */
.install-banner {
  @apply w-full flex justify-between items-center px-6 py-2 shrink-0 gap-4;
}

.shift-selector-inline {
  @apply flex items-center;
}

.shift-selector-inline .shift-bar {
  @apply max-w-xs;
}

.install-banner-button {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg;
}

.install-banner-button.install-available {
  @apply bg-blue-600 hover:bg-blue-500 text-white cursor-pointer;
}

.install-banner-button.install-disabled {
  @apply bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50;
}

.notices-info-button {
  @apply relative flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors shadow-lg;
}

.notice-badge {
  @apply absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center;
}

/* Footer */
.app-footer {
  @apply w-full py-3 px-4 border-t border-zinc-900/50 bg-zinc-950/50 backdrop-blur-sm shrink-0;
  /* Add padding for Android navigation buttons and push footer down a bit more */
  /* Use safe area inset if available, otherwise use fixed 56px for typical Android nav bar */
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 56px));
}

.footer-links {
  @apply flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-[10px] text-zinc-600;
}

.footer-link {
  @apply hover:text-zinc-400 transition-colors cursor-pointer;
}

.dot {
  @apply text-zinc-800;
}

/* Transition for Home Page */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
