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

      <AddCardModal 
        v-if="showAddModal" 
        @close="showAddModal = false"
        @add="handleAddNewCard"
      />
    </template>

    <!-- Info Pages Modal (Global) -->
    <InfoPages 
      v-if="currentInfoPage" 
      :page="currentInfoPage" 
      @close="currentInfoPage = null" 
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import Header from './components/Header.vue'
import SwipeCard from './components/SwipeCard.vue'
import ShiftComplete from './components/ShiftComplete.vue'
import UndoButton from './components/UndoButton.vue'
import AddCardModal from './components/AddCardModal.vue'
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
const showAdminLogin = ref(false)
const showAdminDashboard = ref(false)
const adminPasswordInput = ref('')
const showWelcome = ref(true)
const currentInfoPage = ref(null)
const deferredPrompt = ref(null)

// --- PWA Install Logic ---
onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
  })
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
  { id: 1, title: 'Keys Returned', iconName: 'Key', icon: Key },
  { id: 2, title: 'ID Badge', iconName: 'CreditCard', icon: CreditCard },
  { id: 3, title: 'CDs Locked', iconName: 'Lock', icon: Lock },
  { id: 4, title: 'Handovers Destroyed', iconName: 'FileX', icon: FileX },
  { id: 5, title: 'Meds Signed', iconName: 'Pen', icon: Pen },
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
    icon: item.iconName ? iconMap[item.iconName] : item.icon
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
    safetyChecks.value = [...getFreshChecks(), ...customChecks.value]
    completedItems.value = []
    skippedItems.value = []
    undoHistory.value = []
    window.scrollTo(0, 0)
  }
}

const openAddModal = () => {
  if (customChecks.value.length >= 3) {
    alert("You can only add up to 3 custom cards.")
    return
  }
  showAddModal.value = true
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
  showAddModal.value = false
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
