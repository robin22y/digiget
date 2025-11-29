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
        :can-install="!!deferredPrompt"
        @add-click="openAddModal" 
        @admin-trigger="showAdminLogin = true" 
        @install="handleInstall"
        @manage-cards="showCardManager = true"
      />
      
      <main v-if="!showAdminDashboard" class="main-content">
        <div v-if="safetyChecks.length === 0" class="card-stack-container">
          <ShiftComplete 
            :completed-items="completedItems"
            :skipped-items="skippedItems"
            @reset="handleResetShift"
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
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
import { 
  Key, CreditCard, Lock, FileX, Pen, Radio, 
  Clipboard, AlertCircle, Syringe, UserPlus, Droplets, Thermometer 
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

  // Debug: Check manifest
  if ('serviceWorker' in navigator) {
    fetch('/manifest.webmanifest')
      .then(res => res.json())
      .then(manifest => {
        console.log('✅ Manifest loaded:', manifest)
      })
      .catch(err => {
        console.error('❌ Manifest error:', err)
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
  // Check localStorage (persists forever unless cleared)
  const hasVisited = localStorage.getItem('digiget-visited')
  if (hasVisited) {
    showWelcome.value = false
  } else {
    showWelcome.value = true
  }
}

const startApp = () => {
  showWelcome.value = false
  // Mark as visited so they don't see it again
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
      await logShiftComplete(itemsChecked, skippedTitles)
    } catch (e) { console.error(e) }
  }
}, { deep: true })

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

const handleResetShift = () => {
  if (confirm('Start a new shift checklist?')) {
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
    
    safetyChecks.value = [...allCards, ...additionalCustoms]
    completedItems.value = []
    skippedItems.value = []
    undoHistory.value = []
    window.scrollTo(0, 0)
  }
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
  @apply flex-1 flex items-center justify-center p-6 overflow-hidden;
}

.card-stack-container {
  @apply relative w-full max-w-sm h-full max-h-[600px] flex items-center justify-center;
  perspective: 1000px;
}

.modal-backdrop {
  @apply fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4;
}

/* Footer */
.app-footer {
  @apply w-full py-3 px-4 border-t border-zinc-900/50 bg-zinc-950/50 backdrop-blur-sm shrink-0;
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
