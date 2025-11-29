<template>
  <div
    class="swipe-card"
    :style="cardStyle"
    @touchstart="handleStart"
    @touchmove="handleMove"
    @touchend="handleEnd"
    @mousedown="handleStart"
    @mousemove="handleMove"
    @mouseup="handleEnd"
    @mouseleave="handleEnd"
  >
    <!-- Overlays for Swipe Feedback -->
    <div
      v-if="dragDistance > 20"
      class="overlay done-overlay"
      :style="{ opacity: dragDirection === 'right' ? Math.min(dragDistance / 150, 1) : 0 }"
    >
      <div class="stamp done-stamp">
        <CheckCircle :size="64" weight="fill" />
        <span>DONE</span>
      </div>
    </div>
    <div
      v-if="dragDistance > 20"
      class="overlay skip-overlay"
      :style="{ opacity: dragDirection === 'left' ? Math.min(dragDistance / 150, 1) : 0 }"
    >
      <div class="stamp skip-stamp">
        <XCircle :size="64" weight="fill" />
        <span>SKIP</span>
      </div>
    </div>

    <!-- Card Content -->
    <div class="card-inner">
      <div class="icon-container">
        <component :is="icon" :size="80" stroke-width="1.5" class="card-icon" />
      </div>
      
      <div class="text-content">
        <h2 class="card-title">{{ title }}</h2>
        <p class="card-instruction">Swipe right to confirm</p>
      </div>

      <!-- Visual Cues for Actions -->
      <div class="action-guides">
        <div class="guide left">
          <ArrowLeft :size="20" />
          <span>Skip</span>
        </div>
        <div class="guide right">
          <span>Done</span>
          <ArrowRight :size="20" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowLeft, ArrowRight, CheckCircle, XCircle } from 'lucide-vue-next'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: [Object, Function],
    required: true
  },
  index: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#27272a' // Default zinc-800 color
  }
})

const emit = defineEmits(['swiped'])

// Helper function to darken color for gradient
const getDarkerColor = (color) => {
  // If it's a hex color, darken it
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    // Darken by 20%
    const darkerR = Math.max(0, Math.floor(r * 0.8))
    const darkerG = Math.max(0, Math.floor(g * 0.8))
    const darkerB = Math.max(0, Math.floor(b * 0.8))
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`
  }
  // Fallback to darker version of default
  return '#18181b'
}

// Computed properties for CSS variables
const cardColor = computed(() => props.color || '#27272a')
const cardColorDark = computed(() => getDarkerColor(props.color || '#27272a'))

const isDragging = ref(false)
const startX = ref(0)
const currentX = ref(0)
const startY = ref(0)
const currentY = ref(0)

const dragDistance = computed(() => {
  if (!isDragging.value) return 0
  return Math.abs(currentX.value - startX.value)
})

const dragDirection = computed(() => {
  if (!isDragging.value) return null
  return currentX.value > startX.value ? 'right' : 'left'
})

const rotation = computed(() => {
  if (!isDragging.value) return 0
  const distance = currentX.value - startX.value
  return (distance / 20) * (Math.PI / 180) // Convert to radians
})

const cardStyle = computed(() => {
  const translateX = isDragging.value ? currentX.value - startX.value : 0
  const translateY = isDragging.value ? currentY.value - startY.value : 0
  
  // Stacking effect
  const stackScale = props.index > 0 ? 1 - props.index * 0.05 : 1
  const stackTranslateY = props.index > 0 ? props.index * 12 : 0
  const stackOpacity = props.index > 0 ? 1 - props.index * 0.3 : 1
  
  return {
    transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY + stackTranslateY}px)) scale(${stackScale}) rotate(${rotation.value}rad)`,
    opacity: stackOpacity,
    transition: isDragging.value ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
    zIndex: 100 - props.index
  }
})

const getEventCoordinates = (e) => {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  return { x: e.clientX, y: e.clientY }
}

const handleStart = (e) => {
  // Only prevent default on touch to stop scrolling, but allow mouse interaction
  if (e.type === 'touchstart') {
    // e.preventDefault() // Removed to allow some vertical scroll if needed, handled in move
  }
  isDragging.value = true
  const coords = getEventCoordinates(e)
  startX.value = coords.x
  startY.value = coords.y
  currentX.value = coords.x
  currentY.value = coords.y
}

const handleMove = (e) => {
  if (!isDragging.value) return
  const coords = getEventCoordinates(e)
  currentX.value = coords.x
  currentY.value = coords.y
  
  // Prevent scrolling if dragging horizontally
  const xDiff = Math.abs(currentX.value - startX.value)
  const yDiff = Math.abs(currentY.value - startY.value)
  if (xDiff > yDiff && e.cancelable) {
    e.preventDefault()
  }
}

const handleEnd = (e) => {
  if (!isDragging.value) return
  
  const threshold = 100
  const distance = currentX.value - startX.value
  
  if (Math.abs(distance) > threshold) {
    // Fly off screen
    const direction = distance > 0 ? 'right' : 'left'
    const flyDistance = direction === 'right' ? 1000 : -1000
    
    // Animate off screen
    currentX.value = startX.value + flyDistance
    // Keep Y relatively stable for the fly-out
    
    // Wait for animation, then emit
    setTimeout(() => {
      emit('swiped', direction)
    }, 200)
  } else {
    // Snap back
    currentX.value = startX.value
    currentY.value = startY.value
  }
  
  setTimeout(() => {
    isDragging.value = false
    // Reset positions only after animation frame to prevent jumping
    if (Math.abs(distance) <= threshold) {
        startX.value = 0
        currentX.value = 0
        startY.value = 0
        currentY.value = 0
    }
  }, 300)
}
</script>

<style scoped>
.swipe-card {
  @apply absolute w-full max-w-sm rounded-3xl p-1 shadow-2xl;
  height: 420px; /* Fixed height for consistency */
  touch-action: pan-y; /* Allow vertical scroll, handle horizontal in JS */
  user-select: none;
  cursor: grab;
  top: 50%;
  left: 50%;
  /* Gradient border effect & background */
  background: linear-gradient(145deg, #3f3f46, #18181b);
  border: 1px solid #3f3f46;
}

.swipe-card:active {
  cursor: grabbing;
}

.card-inner {
  @apply h-full w-full rounded-[20px] flex flex-col items-center justify-between p-8 relative overflow-hidden;
  /* Inner shadow for depth */
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
  /* Dynamic background color using CSS variables */
  background: linear-gradient(to bottom, var(--card-color), var(--card-color-dark));
}

.card-inner {
  --card-color: v-bind('cardColor');
  --card-color-dark: v-bind('cardColorDark');
}

.icon-container {
  /* Subtle gradient for icon background */
  @apply w-32 h-32 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center mt-4 mb-6 shadow-lg;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.card-icon {
  @apply text-zinc-300;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
}

.text-content {
  @apply flex flex-col items-center gap-2 mb-4;
}

.card-title {
  @apply text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 text-center tracking-tight;
}

.card-instruction {
  @apply text-zinc-500 text-sm font-medium tracking-wide;
}

/* Action Guides at the bottom */
.action-guides {
  @apply flex w-full justify-between px-2 opacity-40 text-xs font-bold uppercase tracking-widest text-zinc-400 mt-auto;
}

.guide {
  @apply flex items-center gap-1;
}

/* Swipe Overlays */
.overlay {
  @apply absolute inset-0 rounded-3xl flex items-center justify-center pointer-events-none z-50;
  backdrop-filter: blur(2px);
  transition: opacity 0.1s ease;
}

.done-overlay {
  background: radial-gradient(circle, rgba(22, 163, 74, 0.2) 0%, rgba(22, 163, 74, 0) 70%);
}

.skip-overlay {
  background: radial-gradient(circle, rgba(220, 38, 38, 0.2) 0%, rgba(220, 38, 38, 0) 70%);
}

.stamp {
  @apply flex flex-col items-center gap-2 transform rotate-[-10deg];
}

.done-stamp {
  @apply text-green-500;
  filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.4));
}

.skip-stamp {
  @apply text-red-500 transform rotate-[10deg];
  filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.4));
}

.done-stamp span, .skip-stamp span {
  @apply text-4xl font-black tracking-widest border-4 px-4 py-1 rounded-lg;
}

.done-stamp span {
  @apply border-green-500;
}

.skip-stamp span {
  @apply border-red-500;
}
</style>
