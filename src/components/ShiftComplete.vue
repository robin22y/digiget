<template>
  <div class="shift-complete">
    <!-- Confetti Canvas Layer -->
    <canvas ref="canvasRef" class="confetti-canvas"></canvas>

    <div class="header-section">
      <div class="success-icon">
        <CheckCircle :size="64" />
      </div>
      <h1 class="success-title">{{ currentMessage.title }}</h1>
      <p class="success-message text-zinc-400">
        {{ currentMessage.subtitle }}
      </p>
    </div>

    <div class="action-section">
      <div class="buttons-row">
        <button class="share-button" @click="handleShare">
          <Share2 :size="20" />
          Share
        </button>
        <button class="edit-button" @click="handleEditClick">
          <Edit :size="20" />
          Edit
        </button>
      </div>
      <div class="start-shift-section">
        <button class="start-shift-button" @click="$emit('reset')">
          Start Shift Check
        </button>
      </div>
      <AdContainer :current-shift="shiftType" />
    </div>

    <!-- Edit Confirmation Modal -->
    <div v-if="showEditWarning" class="modal-backdrop" @click.self="showEditWarning = false">
      <div class="modal-content bg-zinc-900 border border-zinc-800 p-6 max-w-sm w-full rounded-2xl">
        <h3 class="text-lg font-bold text-white mb-4">Re-open Checklist?</h3>
        <p class="text-zinc-400 mb-6">
          You have already confirmed your safety checks. Re-opening the list is only for corrections. Continue?
        </p>
        
        <div class="flex gap-3">
          <button 
            @click="showEditWarning = false" 
            class="flex-1 py-3 text-zinc-400 hover:text-white font-medium"
          >
            Cancel
          </button>
          <button 
            @click="handleConfirmEdit"
            class="flex-1 py-3 bg-white text-zinc-950 font-bold rounded-xl"
          >
            Continue
          </button>
        </div>
      </div>
    </div>

    <!-- Share Modal -->
    <div v-if="showShareModal" class="modal-backdrop" @click.self="showShareModal = false">
      <div class="modal-content bg-zinc-900 border border-zinc-800 p-6 max-w-sm w-full rounded-2xl">
        <h3 class="text-lg font-bold text-white mb-4">Share Report</h3>
        
        <div class="space-y-3">
          <button 
            @click="shareViaWhatsApp"
            class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <span>📱</span>
            Share via WhatsApp
          </button>
          
          <button 
            @click="shareViaSMS"
            class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <span>💬</span>
            Share via SMS
          </button>
          
          <button 
            @click="copyToClipboard"
            class="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <span>📋</span>
            Copy to Clipboard
          </button>
        </div>
        
        <button 
          @click="showShareModal = false" 
          class="w-full mt-4 py-2 text-zinc-500 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { CheckCircle, Share2, Edit } from 'lucide-vue-next'
import AdContainer from './AdContainer.vue'

const props = defineProps({
  completedItems: {
    type: Array,
    default: () => []
  },
  skippedItems: {
    type: Array,
    default: () => []
  },
  shiftType: {
    type: String,
    default: 'Day'
  }
})

const emit = defineEmits(['reset', 'edit'])

// --- Dynamic Messaging System ---
const messageBank = [
  // Reassuring
  { title: "All done.", subtitle: "You can relax now." },
  { title: "Everything's checked.", subtitle: "Safe to go home." },
  { title: "You're all set.", subtitle: "Drive home in peace." },
  { title: "Nothing forgotten.", subtitle: "Time to rest." },
  
  // Celebratory
  { title: "Shift complete.", subtitle: "Well done today." },
  { title: "That's everything.", subtitle: "Nice work." },
  { title: "All sorted.", subtitle: "You've earned your rest." },
  
  // Context Specific
  { title: "You're free.", subtitle: "Keys? ✓ Meds? ✓ Handover? ✓" },
  { title: "Sleep easy.", subtitle: "No 2am drives back tonight!" },
  { title: "You're done.", subtitle: "Leave work at work." }
]

const currentMessage = ref(messageBank[0])

const pickRandomMessage = () => {
  const randomIndex = Math.floor(Math.random() * messageBank.length)
  currentMessage.value = messageBank[randomIndex]
}

const showEditWarning = ref(false)

const handleEditClick = () => {
  showEditWarning.value = true
}

const handleConfirmEdit = () => {
  showEditWarning.value = false
  emit('edit')
}

const showShareModal = ref(false)

const formatShareMessage = () => {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  
  // Now includes the Shift Type boldly at the top
  let message = `✅ ${props.shiftType} Shift Handover - ${date} ${time}\n\n`
  
  message += `Verified via Digiget App\n`
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`
  
  message += `Completed: ${props.completedItems.length}\n`
  
  if (props.completedItems.length > 0) {
    message += `\n✅ Done:\n`
    props.completedItems.forEach(item => {
      message += `  • ${item.title}\n`
    })
  }
  
  if (props.skippedItems.length > 0) {
    message += `\n⚠️ Skipped:\n`
    props.skippedItems.forEach(item => {
      message += `  • ${item.title}\n`
    })
  } else {
    message += `\n✅ All checks passed!\n`
  }
  
  message += `\n━━━━━━━━━━━━━━━━━━━━\n`
  message += `🔗 https://digiget.uk\n`
  
  return message
}

const handleShare = async () => {
  const message = formatShareMessage()
  const shareData = {
    title: 'Shift Handover Report',
    text: message
  }

  // Try Web Share API first (works with WhatsApp/SMS on mobile)
  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return
    } catch (err) {
      // User cancelled or error - fall through to other options
      if (err.name === 'AbortError') {
        return // User cancelled, don't show fallback
      }
    }
  }
  
  // Fallback: Show share options modal
  showShareModal.value = true
}

const shareViaWhatsApp = () => {
  const message = formatShareMessage()
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
  window.open(whatsappUrl, '_blank')
  showShareModal.value = false
}

const shareViaSMS = () => {
  const message = formatShareMessage()
  const encodedMessage = encodeURIComponent(message)
  const smsUrl = `sms:?body=${encodedMessage}`
  window.location.href = smsUrl
  showShareModal.value = false
}

const copyToClipboard = async () => {
  const message = formatShareMessage()
  try {
    await navigator.clipboard.writeText(message)
    alert('Report copied to clipboard!')
    showShareModal.value = false
  } catch (err) {
    console.error('Failed to copy:', err)
    alert('Failed to copy. Please try again.')
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
  
  // Haptic feedback removed - vibration requires user gesture
  // Will be added to button clicks instead if needed
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
  pickRandomMessage() // Pick message when component loads
  initConfetti()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.shift-complete {
  @apply flex flex-col items-center w-full relative;
  animation: fadeIn 0.5s ease-in;
  min-height: 0;
  flex: 1 1 auto;
}

.confetti-canvas {
  @apply fixed inset-0 pointer-events-none z-50;
  width: 100vw;
  height: 100vh;
}

.header-section {
  @apply flex-none flex flex-col items-center justify-center py-4 relative z-10;
}

.success-icon {
  @apply text-green-500 mb-4;
  animation: scaleIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.success-title {
  @apply text-3xl font-bold text-zinc-100 mb-1 text-center leading-tight;
}

.success-message {
  @apply text-lg font-medium text-center text-zinc-400 px-4;
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
  @apply flex-none w-full flex flex-col items-center pb-2 pt-2 relative z-10;
}

.buttons-row {
  @apply flex w-full max-w-xs gap-3 mb-4 items-stretch;
}

.share-button {
  @apply flex-1 bg-zinc-800 text-zinc-300 font-bold py-4 rounded-xl shadow-lg 
         hover:bg-zinc-700 hover:text-white active:scale-95 transition-all 
         flex items-center justify-center gap-2 min-h-[56px];
}

.edit-button {
  @apply flex-1 bg-zinc-800 text-zinc-300 font-bold py-4 rounded-xl shadow-lg 
         hover:bg-zinc-700 hover:text-white active:scale-95 transition-all 
         flex items-center justify-center gap-2 min-h-[56px];
}

.start-shift-section {
  @apply w-full max-w-xs mt-4;
}

.start-shift-button {
  @apply w-full bg-zinc-100 text-zinc-950 font-bold py-4 rounded-xl shadow-lg 
         hover:bg-white active:scale-95 transition-all 
         flex items-center justify-center gap-2;
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

.modal-backdrop {
  @apply fixed inset-0 bg-black/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4;
}

.modal-content {
  animation: fadeIn 0.2s ease-out;
}
</style>
