<template>
  <div class="app-container">
    
    <!-- 1. The New Home Page (Welcome Screen) -->
    <Transition name="fade">
      <WelcomeScreen 
        v-if="showWelcome" 
        :can-install="!!deferredPrompt"
        @start="startApp" 
        @open-info="openInfoPage"
        @install="handleInstall"
      />
    </Transition>

    <!-- 2. The Main App (Header + Checklist) -->
    <template v-if="!showWelcome">
      <Header 
        v-if="!showAdminDashboard" 
        @add-click="openAddModal" 
        @admin-trigger="showAdminLogin = true" 
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
        
        <!-- Install Button (right side) -->
        <button 
          class="install-banner-button"
          :class="{ 'install-available': deferredPrompt, 'install-disabled': !deferredPrompt }"
          @click="handleInstall"
          :disabled="!deferredPrompt"
          :title="deferredPrompt ? 'Install Digiget App' : 'Install not available'"
        >
          <Download :size="18" />
          <span>Install</span>
        </button>
      </div>
      
      <main v-if="!showAdminDashboard" class="main-content">

        <div v-if="safetyChecks.length === 0" class="card-stack-container">
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
            v-for="(check, index) in safetyChecks"
            :key="check.id"
            :title="check.title"
            :icon="check.icon"
            :index="index"
            :color="check.color || '#27272a'"
            :style="{ zIndex: safetyChecks.length - index }"
            @swiped="handleSwipe(check.id, $event)"
          />
          <UndoButton 
            :can-undo="undoHistory.length > 0" 
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
    />

    <!-- Add/Edit Card Modal -->
    <AddCardModal 
      v-if="showAddModal"
      :card="cardToEdit"
      @close="closeCardModal"
      @add="handleAddNewCard"
      @update="handleUpdateCard"
    />

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
import UndoButton from './components/UndoButton.vue'
import AddCardModal from './components/AddCardModal.vue'
import CardManager from './components/CardManager.vue'
import AdminDashboard from './components/AdminDashboard.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'
import InfoPages from './components/InfoPages.vue'
import { logShiftComplete } from './firebase.js'
import { inject } from '@vercel/analytics'
import { 
  Key, CreditCard, Lock, FileX, Pen, Radio, 
  Clipboard, AlertCircle, Syringe, UserPlus, Droplets, Thermometer, Download
} from 'lucide-vue-next'

const iconMap = {
  Key, CreditCard, Lock, FileX, Pen, Radio,
  Clipboard, AlertCircle, Syringe, UserPlus, Droplets, Thermometer
}

const showAddModal = ref(false)
const showCardManager = ref(false)
const showAdminLogin = ref(false)
const showAdminDashboard = ref(false)
const adminPasswordInput = ref('')
const showWelcome = ref(true)
const currentInfoPage = ref(null)
const deferredPrompt = ref(null)
const cardToEdit = ref(null)
const currentShift = ref('Day') // Store the selected shift type

// --- PWA Install Logic ---
onMounted(() => {
  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('✅ PWA install prompt available!')
    e.preventDefault()
    deferredPrompt.value = e
  })

  // Debug: Check if service worker is registered
  if ('serviceWorker' in navigator) {
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
        console.log('✅ Manifest loaded:', manifest)
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
}

const openInfoPage = (pageName) => {
  currentInfoPage.value = pageName
}

// --- Admin Logic ---
const handleAdminLogin = () => {
  if (adminPasswordInput.value === 'Rncdm@2025') {
    showAdminDashboard.value = true
    showAdminLogin.value = false
    adminPasswordInput.value = ''
  } else {
    showAdminLogin.value = false
    adminPasswordInput.value = ''
  }
}

// --- Data Logic ---
const getFreshChecks = () => [
  { id: 1, title: 'Keys Returned', iconName: 'Key', icon: Key, color: '#27272a' },
  { id: 2, title: 'Skin Check', iconName: 'AlertCircle', icon: AlertCircle, color: '#27272a' },
  { id: 3, title: 'CDs Locked', iconName: 'Lock', icon: Lock, color: '#27272a' },
  { id: 4, title: 'Handovers Destroyed', iconName: 'FileX', icon: FileX, color: '#27272a' },
  { id: 5, title: 'Critical Meds Signed', iconName: 'Pen', icon: Pen, color: '#27272a' },
]

const defaultChecks = ref([])
const customChecks = ref([])
const safetyChecks = ref([])
const completedItems = ref([])
const skippedItems = ref([])
const undoHistory = ref([])

const restoreIcons = (items) => {
  return items.map(item => ({
    ...item,
    icon: item.iconName ? iconMap[item.iconName] : item.icon,
    color: item.color || '#27272a' // Ensure color is always present
  }))
}

const loadState = () => {
  try {
    const saved = localStorage.getItem('digiget-state')
    if (saved) {
      const state = JSON.parse(saved)
      customChecks.value = restoreIcons(state.customChecks || [])
      
      if (state.safetyChecks) {
        safetyChecks.value = restoreIcons(state.safetyChecks)
      } else {
        safetyChecks.value = [...getFreshChecks(), ...customChecks.value]
      }
      
      completedItems.value = restoreIcons(state.completedItems || [])
      skippedItems.value = restoreIcons(state.skippedItems || [])
      undoHistory.value = state.undoHistory ? state.undoHistory.map(item => ({
          ...item,
          check: restoreIcons([item.check])[0]
        })) : []
        
    } else {
      customChecks.value = []
      safetyChecks.value = getFreshChecks()
    }
  } catch (e) {
    safetyChecks.value = getFreshChecks()
  }
}

const saveState = () => {
  const serialize = (items) => items.map(item => ({
    ...item,
    iconName: item.iconName || Object.keys(iconMap).find(key => iconMap[key] === item.icon) || 'Clipboard',
    icon: undefined
  }))

  const state = {
    customChecks: serialize(customChecks.value),
    safetyChecks: serialize(safetyChecks.value),
    completedItems: serialize(completedItems.value),
    skippedItems: serialize(skippedItems.value),
    undoHistory: undoHistory.value.map(item => ({
      ...item,
      check: serialize([item.check])[0]
    }))
  }
  localStorage.setItem('digiget-state', JSON.stringify(state))
}

// Init
checkVisitHistory() // Check if user has visited before
loadState()

watch([safetyChecks, customChecks, completedItems, skippedItems, undoHistory], () => {
  saveState()
}, { deep: true })

watch(safetyChecks, async (newChecks) => {
  if (newChecks.length === 0 && (completedItems.value.length > 0 || skippedItems.value.length > 0)) {
    try {
      const itemsChecked = completedItems.value.length
      const skippedTitles = skippedItems.value.map(item => item.title)
      // Pass the currentShift.value to Firebase!
      await logShiftComplete(itemsChecked, skippedTitles, currentShift.value)
      
      // Store the completion timestamp for cooldown check
      localStorage.setItem('digiget-last-completion', Date.now().toString())
    } catch (e) { console.error(e) }
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
  if (!swipedCheck) return

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

const handleResetDay = () => {
  if (confirm('Reset today\'s entry? This will clear today\'s progress only. Your custom cards and history will be preserved.')) {
    // Reset only today's session - preserves custom cards and historical data
    // Get all cards (including edited defaults that are now in customChecks)
    // Start with fresh defaults, but replace with custom versions if they exist
    const freshDefaults = getFreshChecks()
    const allCards = freshDefaults.map(defaultCard => {
      // Check if this default card has been customized
      const customVersion = customChecks.value.find(c => 
        c.id === defaultCard.id || 
        (c.title === defaultCard.title && c.iconName === defaultCard.iconName)
      )
      return customVersion || defaultCard
    })
    
    // Add any additional custom cards that aren't defaults
    const defaultTitles = new Set(freshDefaults.map(c => c.title))
    const additionalCustoms = customChecks.value.filter(c => 
      !defaultTitles.has(c.title) && 
      !freshDefaults.some(d => d.id === c.id)
    )
    
    // Reset only current session data (today's entry)
    // Note: customChecks is preserved (user's custom cards)
    // Note: Historical Firebase logs are preserved (already saved separately)
    safetyChecks.value = [...allCards, ...additionalCustoms]
    completedItems.value = []
    skippedItems.value = []
    undoHistory.value = []
    window.scrollTo(0, 0)
  }
}

const showCooldownWarning = ref(false)

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

const handleEditShift = () => {
  // Re-open the checklist for editing after confirmation
  // Restore all cards from completed/skipped back to safetyChecks
  // This allows the user to edit their choices
  
  console.log('handleEditShift called')
  console.log('completedItems:', completedItems.value.length)
  console.log('skippedItems:', skippedItems.value.length)
  
  // Combine completed and skipped items
  const allSwipedCards = [...completedItems.value, ...skippedItems.value]
  
  console.log('All swiped cards:', allSwipedCards.length)
  if (allSwipedCards.length > 0) {
    console.log('Sample card:', allSwipedCards[0])
  }
  
  // Ensure icons are properly restored and all properties are present
  const restoredCards = restoreIcons(allSwipedCards).map(card => {
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
  
  console.log('Restored cards:', restoredCards.length)
  if (restoredCards.length > 0) {
    console.log('Sample restored card:', restoredCards[0])
  }
  
  // If no cards to restore, something went wrong - restore from defaults
  if (restoredCards.length === 0) {
    console.warn('No cards to restore! Restoring from defaults...')
    const freshDefaults = getFreshChecks()
    const allDefaultCards = freshDefaults.map(defaultCard => {
      const customVersion = customChecks.value.find(c => 
        c.id === defaultCard.id || 
        (c.title === defaultCard.title && c.iconName === defaultCard.iconName)
      )
      return customVersion || defaultCard
    })
    const defaultTitles = new Set(freshDefaults.map(c => c.title))
    const additionalCustoms = customChecks.value.filter(c => 
      !defaultTitles.has(c.title) && 
      !freshDefaults.some(d => d.id === c.id)
    )
    safetyChecks.value = [...allDefaultCards, ...additionalCustoms]
  } else {
    // Restore the cards to safetyChecks
    safetyChecks.value = restoredCards
  }
  
  // Clear completed/skipped and undo history
  completedItems.value = []
  skippedItems.value = []
  undoHistory.value = []
  
  // Force a save to localStorage to persist the restored state
  saveState()
  
  window.scrollTo(0, 0)
  
  console.log('Edit shift complete. safetyChecks now has', safetyChecks.value.length, 'cards')
}

// Get all cards for management (combine default and custom, but use current state)
const allCardsForManagement = computed(() => {
  // Get all unique cards - always include defaults, plus any custom/edited versions
  const allCardIds = new Set()
  const allCards = []
  
  // Start with default cards - these are always available for editing
  const defaultCards = getFreshChecks()
  defaultCards.forEach(card => {
    // Check if there's a custom/edited version of this default card
    const customVersion = customChecks.value.find(c => 
      c.id === card.id || 
      (c.title === card.title && c.iconName === card.iconName)
    )
    
    // Use custom version if it exists, otherwise use default
    const cardToAdd = customVersion || card
    if (!allCardIds.has(cardToAdd.id)) {
      allCardIds.add(cardToAdd.id)
      allCards.push(cardToAdd)
    }
  })
  
  // Add any additional custom cards that aren't defaults
  customChecks.value.forEach(card => {
    const isDefault = defaultCards.some(d => d.id === card.id)
    if (!isDefault && !allCardIds.has(card.id)) {
      allCardIds.add(card.id)
      allCards.push(card)
    }
  })
  
  // Add cards from current safety checks (in case they're not in defaults or custom)
  safetyChecks.value.forEach(card => {
    if (!allCardIds.has(card.id)) {
      allCardIds.add(card.id)
      allCards.push(card)
    }
  })
  
  // Add cards from completed/skipped that might have been removed from stack
  const completedAndSkipped = [...completedItems.value, ...skippedItems.value]
  completedAndSkipped.forEach(card => {
    if (!allCardIds.has(card.id)) {
      allCardIds.add(card.id)
      allCards.push(card)
    }
  })
  
  return allCards.sort((a, b) => a.title.localeCompare(b.title))
})

const openAddModal = () => {
  cardToEdit.value = null
  if (allCardsForManagement.value.length >= 10) {
    alert("You can only have up to 10 cards total.")
    return
  }
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

const handleAddNewCard = ({ title, iconName, color }) => {
  const newCard = {
    id: Date.now(),
    title: title,
    iconName: iconName,
    icon: iconMap[iconName],
    color: color
  }
  customChecks.value.push(newCard)
  safetyChecks.value.unshift(newCard)
  closeCardModal()
}

const handleUpdateCard = ({ id, title, iconName, color }) => {
  const updatedCard = {
    id: id,
    title: title,
    iconName: iconName,
    icon: iconMap[iconName],
    color: color
  }
  
  // Update in custom checks if it exists there
  const customIndex = customChecks.value.findIndex(c => c.id === id)
  if (customIndex !== -1) {
    customChecks.value[customIndex] = updatedCard
  } else {
    // If it's a default card, add it to custom checks so it persists
    customChecks.value.push(updatedCard)
  }
  
  // Update in safety checks
  const safetyIndex = safetyChecks.value.findIndex(c => c.id === id)
  if (safetyIndex !== -1) {
    safetyChecks.value[safetyIndex] = updatedCard
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
  undoHistory.value.forEach(item => {
    if (item.check.id === id) {
      item.check = updatedCard
    }
  })
  
  closeCardModal()
}
</script>

<style scoped>
.app-container {
  @apply h-screen w-screen flex flex-col bg-zinc-950 overflow-hidden;
}

.main-content {
  @apply flex-1 flex flex-col items-center justify-center p-6 overflow-hidden;
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

/* Footer */
.app-footer {
  @apply w-full py-3 px-4 border-t border-zinc-900/50 bg-zinc-950/50 backdrop-blur-sm shrink-0;
  /* Add padding for Android navigation buttons */
  /* Use safe area inset if available, otherwise use fixed 56px for typical Android nav bar */
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 56px));
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
