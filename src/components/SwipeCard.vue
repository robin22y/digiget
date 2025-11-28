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
    <!-- Overlays -->
    <div
      v-if="dragDistance > 50"
      class="overlay done-overlay"
      :style="{ opacity: dragDirection === 'right' ? Math.min(dragDistance / 200, 1) : 0 }"
    >
      <div class="stamp done-stamp">DONE</div>
    </div>
    <div
      v-if="dragDistance > 50"
      class="overlay skip-overlay"
      :style="{ opacity: dragDirection === 'left' ? Math.min(dragDistance / 200, 1) : 0 }"
    >
      <div class="stamp skip-stamp">SKIP</div>
    </div>

    <!-- Card Content -->
    <div class="card-content">
      <component :is="icon" class="card-icon" :size="48" />
      <h2 class="card-title">{{ title }}</h2>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

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
  }
})

const emit = defineEmits(['swiped'])

const isDragging = ref(false)
const startX = ref(0)
const currentX = ref(0)
const startY = ref(0)
const currentY = ref(0)
const cardCenterX = ref(0)
const cardCenterY = ref(0)

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
  return (distance / 20) * (Math.PI / 180) // Convert to radians, max ~18 degrees
})

const cardStyle = computed(() => {
  const translateX = isDragging.value ? currentX.value - startX.value : 0
  const translateY = isDragging.value ? currentY.value - startY.value : 0
  
  // Stacking effect for cards behind the top one
  const stackScale = props.index > 0 ? 1 - props.index * 0.05 : 1
  const stackTranslateY = props.index > 0 ? props.index * 8 : 0
  
  return {
    transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY + stackTranslateY}px)) scale(${stackScale}) rotate(${rotation.value}rad)`,
    transition: isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: isDragging.value ? 50 : 1
  }
})

const getEventCoordinates = (e) => {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  return { x: e.clientX, y: e.clientY }
}

const handleStart = (e) => {
  e.preventDefault()
  isDragging.value = true
  const coords = getEventCoordinates(e)
  startX.value = coords.x
  startY.value = coords.y
  currentX.value = coords.x
  currentY.value = coords.y
}

const handleMove = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const coords = getEventCoordinates(e)
  currentX.value = coords.x
  currentY.value = coords.y
}

const handleEnd = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  
  const threshold = 100
  const distance = Math.abs(currentX.value - startX.value)
  
  if (distance > threshold) {
    // Fly off screen
    const direction = dragDirection.value
    const flyDistance = direction === 'right' ? 1000 : -1000
    
    // Animate off screen
    currentX.value = startX.value + flyDistance
    currentY.value = startY.value
    
    // Wait for animation, then emit
    setTimeout(() => {
      emit('swiped', direction)
    }, 300)
  } else {
    // Snap back
    currentX.value = startX.value
    currentY.value = startY.value
  }
  
  setTimeout(() => {
    isDragging.value = false
    startX.value = 0
    currentX.value = 0
    startY.value = 0
    currentY.value = 0
  }, 300)
}
</script>

<style scoped>
.swipe-card {
  @apply absolute w-full max-w-sm bg-zinc-900 rounded-xl p-8 border border-zinc-800 shadow-2xl;
  touch-action: none;
  user-select: none;
  cursor: grab;
  top: 50%;
  left: 50%;
}

.swipe-card:active {
  cursor: grabbing;
}

.card-content {
  @apply flex flex-col items-center justify-center gap-4;
  pointer-events: none;
}

.card-icon {
  @apply text-zinc-400;
}

.card-title {
  @apply text-xl font-semibold text-zinc-100 text-center;
}

.overlay {
  @apply absolute inset-0 rounded-xl flex items-center justify-center pointer-events-none;
  transition: opacity 0.2s ease;
}

.done-overlay {
  @apply bg-green-500/20;
}

.skip-overlay {
  @apply bg-red-500/20;
}

.stamp {
  @apply text-4xl font-bold tracking-wider;
  transform: rotate(-15deg);
}

.done-stamp {
  @apply text-green-400;
  text-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
}

.skip-stamp {
  @apply text-red-400;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
}
</style>

