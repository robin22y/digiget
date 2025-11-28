<template>
  <div class="app-container">
    <Header @settings-click="handleSettingsClick" />
    <main class="main-content">
      <div v-if="safetyChecks.length === 0" class="card-stack-container">
        <ShiftComplete />
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import Header from './components/Header.vue'
import SwipeCard from './components/SwipeCard.vue'
import ShiftComplete from './components/ShiftComplete.vue'
import UndoButton from './components/UndoButton.vue'
import { Key, CreditCard, Lock, FileX, Pen, Radio } from 'lucide-vue-next'
import { logShiftComplete } from './firebase.js'

// Icon mapping for serialization
const iconMap = {
  Key,
  CreditCard,
  Lock,
  FileX,
  Pen,
  Radio
}

// Default safety checks with icon names for serialization
const defaultSafetyChecks = [
  {
    id: 1,
    title: 'Keys Returned',
    iconName: 'Key',
    icon: Key
  },
  {
    id: 2,
    title: 'ID Badge',
    iconName: 'CreditCard',
    icon: CreditCard
  },
  {
    id: 3,
    title: 'CDs Locked',
    iconName: 'Lock',
    icon: Lock
  },
  {
    id: 4,
    title: 'Handovers Destroyed',
    iconName: 'FileX',
    icon: FileX
  },
  {
    id: 5,
    title: 'Meds Signed',
    iconName: 'Pen',
    icon: Pen
  },
  {
    id: 6,
    title: 'Bleep/Pager Returned',
    iconName: 'Radio',
    icon: Radio
  }
]

// Helper to restore icon components from icon names
const restoreIcons = (items) => {
  return items.map(item => ({
    ...item,
    icon: item.iconName ? iconMap[item.iconName] : item.icon
  }))
}

// Initialize from localStorage or use defaults
const loadStateFromStorage = () => {
  try {
    const saved = localStorage.getItem('digiget-state')
    if (saved) {
      const state = JSON.parse(saved)
      return {
        safetyChecks: restoreIcons(state.safetyChecks || defaultSafetyChecks),
        completedItems: restoreIcons(state.completedItems || []),
        skippedItems: restoreIcons(state.skippedItems || []),
        undoHistory: state.undoHistory ? state.undoHistory.map(item => ({
          ...item,
          check: restoreIcons([item.check])[0]
        })) : []
      }
    }
  } catch (error) {
    console.error('Error loading state from localStorage:', error)
  }
  return {
    safetyChecks: [...defaultSafetyChecks],
    completedItems: [],
    skippedItems: [],
    undoHistory: []
  }
}

// Initialize state
const initialState = loadStateFromStorage()
const safetyChecks = ref(initialState.safetyChecks)
const completedItems = ref(initialState.completedItems)
const skippedItems = ref(initialState.skippedItems)
const undoHistory = ref(initialState.undoHistory)

// Save state to localStorage (serialize icons to icon names)
const saveStateToStorage = () => {
  try {
    // Convert icon components to icon names for serialization
    const serializeItems = (items) => {
      return items.map(item => ({
        ...item,
        iconName: item.iconName || Object.keys(iconMap).find(key => iconMap[key] === item.icon) || null,
        icon: undefined // Remove icon component for serialization
      }))
    }
    
    const state = {
      safetyChecks: serializeItems(safetyChecks.value),
      completedItems: serializeItems(completedItems.value),
      skippedItems: serializeItems(skippedItems.value),
      undoHistory: undoHistory.value.map(item => ({
        ...item,
        check: serializeItems([item.check])[0]
      }))
    }
    localStorage.setItem('digiget-state', JSON.stringify(state))
  } catch (error) {
    console.error('Error saving state to localStorage:', error)
  }
}

// Watch for changes and save to localStorage
watch([safetyChecks, completedItems, skippedItems, undoHistory], () => {
  saveStateToStorage()
}, { deep: true })

// Watch for shift completion
watch(safetyChecks, async (newChecks) => {
  if (newChecks.length === 0 && (completedItems.value.length > 0 || skippedItems.value.length > 0)) {
    // All cards have been swiped, log the shift
    try {
      const itemsChecked = completedItems.value.length
      const skippedTitles = skippedItems.value.map(item => item.title)
      
      await logShiftComplete(itemsChecked, skippedTitles)
      console.log('Shift completion logged successfully')
    } catch (error) {
      console.error('Error logging shift completion:', error)
      // Note: Firestore will queue this write if offline and sync when online
    }
  }
}, { deep: true })

const handleSwipe = (checkId, direction) => {
  // Find the swiped check
  const swipedCheck = safetyChecks.value.find(check => check.id === checkId)
  
  if (swipedCheck) {
    // Add to undo history before removing
    undoHistory.value.push({
      check: swipedCheck,
      direction: direction,
      originalIndex: safetyChecks.value.findIndex(c => c.id === checkId)
    })
    
    if (direction === 'right') {
      // Swiped right = DONE
      completedItems.value.push(swipedCheck)
    } else if (direction === 'left') {
      // Swiped left = SKIP
      skippedItems.value.push(swipedCheck)
    }
  }
  
  // Remove the swiped card from the stack
  safetyChecks.value = safetyChecks.value.filter(check => check.id !== checkId)
  
  console.log(`Swiped ${direction}:`, checkId, swipedCheck?.title)
}

const handleUndo = () => {
  if (undoHistory.value.length === 0) return
  
  // Get the last swiped item
  const lastAction = undoHistory.value.pop()
  const { check, direction, originalIndex } = lastAction
  
  // Remove from completed/skipped items
  if (direction === 'right') {
    completedItems.value = completedItems.value.filter(item => item.id !== check.id)
  } else if (direction === 'left') {
    skippedItems.value = skippedItems.value.filter(item => item.id !== check.id)
  }
  
  // Restore the card to the stack at its original position
  // Insert at the original index or at the beginning if index is out of bounds
  const insertIndex = Math.min(originalIndex, safetyChecks.value.length)
  safetyChecks.value.splice(insertIndex, 0, check)
  
  console.log('Undo:', check.title)
}

const handleSettingsClick = () => {
  console.log('Settings clicked')
  // Settings logic will be added later
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
  @apply relative w-full max-w-sm h-96 flex items-center justify-center;
  perspective: 1000px;
}
</style>
