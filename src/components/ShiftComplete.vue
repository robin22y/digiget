<template>
  <div class="shift-complete">
    <!-- Confetti Canvas Layer -->
    <canvas ref="canvasRef" class="confetti-canvas"></canvas>

    <div class="header-section">
      <div class="success-icon">
        <CheckCircle :size="64" />
      </div>
      <h1 class="success-title">Shift Complete</h1>
      <p class="success-message">
        <span class="text-green-400">{{ completedItems.length }} Done</span>
        <span class="mx-2 text-zinc-600">|</span>
        <span :class="skippedItems.length > 0 ? 'text-red-400' : 'text-zinc-500'">
          {{ skippedItems.length }} Skipped
        </span>
      </p>
    </div>

    <!-- Scrollable Review List -->
    <div class="review-list">
      <h3 class="list-header">Session Summary</h3>
      
      <!-- Skipped Items First (Important to review) -->
      <div v-for="item in skippedItems" :key="item.id" class="review-item skipped">
        <div class="item-icon-wrapper bg-red-500/10 text-red-400">
          <X :size="16" />
        </div>
        <span class="item-text text-red-200">{{ item.title }}</span>
      </div>

      <!-- Completed Items -->
      <div v-for="item in completedItems" :key="item.id" class="review-item completed">
        <div class="item-icon-wrapper bg-green-500/10 text-green-400">
          <Check :size="16" />
        </div>
        <span class="item-text">{{ item.title }}</span>
      </div>
    </div>

    <div class="action-section">
      <div class="buttons-row">
        <button class="share-button" @click="handleShare">
          <Share2 :size="20" />
          Share
        </button>
        <button class="reset-button" @click="$emit('reset')">
          Start New Shift
        </button>
      </div>
      <AdContainer />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { CheckCircle, Check, X, Share2 } from 'lucide-vue-next'
import AdContainer from './AdContainer.vue'

defineProps({
  completedItems: {
    type: Array,
    default: () => []
  },
  skippedItems: {
    type: Array,
    default: () => []
  }
})

defineEmits(['reset'])

// --- Share Logic ---
const handleShare = async () => {
  const shareData = {
    title: 'Digiget',
    text: 'Check your keys, meds, and ID before you leave. Use Digiget for a safer shift handover.',
    url: window.location.origin
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch (err) {
      console.error('Error sharing:', err)
    }
  } else {
    // Fallback for browsers that don't support Web Share API
    try {
      await navigator.clipboard.writeText(shareData.url)
      alert('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
}

// --- Confetti Logic ---
const canvasRef = ref(null)
let animationId = null
const particles = []

// NHS & Brand Colors for confetti
const colors = ['#005EB8', '#009639', '#FFFFFF', '#fbbf24', '#f472b6'] 

const createParticle = (x, y) => {
  const speed = Math.random() * 5 + 2
  const angle = Math.random() * Math.PI * 2
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 2, // Initial upward burst
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1,
    decay: Math.random() * 0.02 + 0.02 // FASTER DECAY (Quicker fade out)
  }
}

const initConfetti = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // Create explosion from center
  const centerX = canvas.width / 2
  const centerY = canvas.height / 3 // Slightly higher than center to match checkmark
  
  // Reduced count slightly for cleaner look
  for (let i = 0; i < 100; i++) {
    particles.push(createParticle(centerX, centerY))
  }

  animate(ctx, canvas)
  
  // Haptic feedback
  if (navigator.vibrate) navigator.vibrate([100, 50, 100])
}

const animate = (ctx, canvas) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  let activeParticles = false
  
  particles.forEach((p, index) => {
    if (p.life > 0) {
      activeParticles = true
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.25 // INCREASED GRAVITY (Falls faster)
      p.life -= p.decay
      
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.fillStyle = p.color
      
      // Draw confetti squares/rectangles
      ctx.fillRect(p.x, p.y, p.size, p.size)
    }
  })
  
  if (activeParticles) {
    animationId = requestAnimationFrame(() => animate(ctx, canvas))
  } else {
    // Clear canvas when done to ensure no artifacts
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

onMounted(() => {
  initConfetti()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.shift-complete {
  @apply flex flex-col items-center h-full w-full max-h-full relative;
  animation: fadeIn 0.5s ease-in;
}

.confetti-canvas {
  @apply fixed inset-0 pointer-events-none z-50;
  width: 100vw;
  height: 100vh;
}

.header-section {
  @apply flex-none flex flex-col items-center justify-center py-6 relative z-10;
}

.success-icon {
  @apply text-green-500 mb-4;
  animation: scaleIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.success-title {
  @apply text-3xl font-bold text-zinc-100 mb-1;
}

.success-message {
  @apply text-lg font-medium;
}

/* Scrollable Review List */
.review-list {
  @apply flex-1 w-full overflow-y-auto px-2 mb-4 scrollbar-hide relative z-10;
  mask-image: linear-gradient(to bottom, transparent, black 5%, black 95%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 5%, black 95%, transparent);
}

.list-header {
  @apply text-xs uppercase tracking-wider text-zinc-500 font-bold mb-4 text-center;
}

.review-item {
  @apply flex items-center gap-3 p-3 mb-2 rounded-xl bg-zinc-900 border border-zinc-800/50;
  animation: slideUp 0.4s ease-out forwards;
  opacity: 0;
}

/* Stagger animation for list items */
.review-item:nth-child(1) { animation-delay: 0.1s; }
.review-item:nth-child(2) { animation-delay: 0.15s; }
.review-item:nth-child(3) { animation-delay: 0.2s; }
.review-item:nth-child(4) { animation-delay: 0.25s; }
.review-item:nth-child(5) { animation-delay: 0.3s; }

.review-item.skipped {
  @apply border-red-900/30 bg-red-950/10;
}

.item-icon-wrapper {
  @apply w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0;
}

.item-text {
  @apply text-sm font-medium text-zinc-300;
}

.action-section {
  @apply flex-none w-full flex flex-col items-center pb-6 pt-2 relative z-10;
}

.buttons-row {
  @apply flex w-full max-w-xs gap-3 mb-4;
}

.share-button {
  @apply flex-1 bg-zinc-800 text-zinc-300 font-bold py-4 rounded-xl shadow-lg 
         hover:bg-zinc-700 hover:text-white active:scale-95 transition-all flex items-center justify-center gap-2;
}

.reset-button {
  @apply flex-[2] bg-zinc-100 text-zinc-950 font-bold py-4 rounded-xl shadow-lg 
         hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-2;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
