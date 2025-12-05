<template>
  <div class="shift-complete">
    <!-- Confetti Canvas Layer -->
    <canvas ref="canvasRef" class="confetti-canvas"></canvas>

    <div class="header-section">
      <div class="success-icon">
        <CheckCircle :size="52" />
      </div>
      <h1 class="success-title">{{ currentMessage.title }}</h1>
      <p class="success-message text-zinc-400">
        {{ currentMessage.subtitle }}
      </p>
    </div>

    <!-- Completed Items List -->
    <div v-if="completedItems.length > 0" class="completed-list-section">
      <div class="list-header">✅ Completed Items</div>
      <div class="review-list">
        <div 
          v-for="item in completedItems" 
          :key="item.id"
          class="review-item completed"
        >
          <div class="item-icon-wrapper bg-green-900/30 border border-green-800/50">
            <CheckCircle :size="20" class="text-green-400" />
          </div>
          <span class="item-text">{{ item.title }}</span>
        </div>
      </div>
    </div>

    <div class="action-section">
      <!-- Three Equal Buttons Row -->
      <div class="buttons-row">
        <button class="action-button share-button" @click="handleShare">
          <Share2 :size="20" />
          <span>Share</span>
        </button>
        <button class="action-button new-button" @click="$emit('reset')">
          <span>New</span>
        </button>
        <div class="flex-1 flex flex-col gap-2">
          <button class="action-button edit-button" @click="handleEditClick">
            <Edit :size="20" />
            <span>Edit</span>
          </button>
          <button class="action-button contact-button" @click="handleContact" title="hello@digiget.uk">
            <Mail :size="18" />
            <span>Contact</span>
          </button>
        </div>
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
          <!-- WhatsApp - Prominent green button -->
          <button 
            @click="shareViaWhatsApp"
            class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg"
            style="box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span>Share via WhatsApp</span>
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
import { CheckCircle, Share2, Edit, Mail } from 'lucide-vue-next'
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
  // Relatable Nursing Humor
  { title: "Check your pockets.", subtitle: "Three pens, two swabs, one mystery syringe cap." },
  { title: "Not your circus anymore.", subtitle: "Not your monkeys. (Until tomorrow)." },
  { title: "Right—hydrate.", subtitle: "And no, coffee doesn't count this time." },
  { title: "Remember daylight?", subtitle: "It's still out there. Go find it." },
  { title: "Uniform off.", subtitle: "Human mode: reactivated." },

  // Affirmation & Pride
  { title: "You kept people alive today.", subtitle: "That's not nothing." },
  { title: "Shift conquered.", subtitle: "You handled it. All of it." },
  { title: "Handover done.", subtitle: "You left things better than you found them." },
  { title: "You made a difference.", subtitle: "Even if nobody said thank you." },

  // Pure Relief
  { title: "Go home.", subtitle: "Your bed's been waiting." },
  { title: "No call bells from here.", subtitle: "No alarms. Just quiet." },
  { title: "Your phone's on silent.", subtitle: "The ward can't reach you now." },
  { title: "Eat something proper.", subtitle: "Hot food. Sitting down. Revolutionary." },
  
  // The "Safe to Leave" Reassurance
  { title: "You're good to go.", subtitle: "Keys, phone, brain mostly intact. Drive safe." },
  { title: "Everything's handed over.", subtitle: "You can stop thinking now." }
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
  
  // Deduplicate items by ID to prevent repeated lines
  const getUniqueItems = (items) => {
    const seen = new Set()
    return items.filter(item => {
      const id = item.id || item.title // Use ID if available, fallback to title
      if (seen.has(id)) {
        return false // Skip duplicate
      }
      seen.add(id)
      return true
    })
  }
  
  const uniqueCompleted = getUniqueItems(props.completedItems)
  const uniqueSkipped = getUniqueItems(props.skippedItems)
  
  // Now includes the Shift Type boldly at the top
  let message = `✅ ${props.shiftType} Shift Handover - ${date} ${time}\n\n`
  
  message += `Verified via Digiget App\n`
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`
  
  message += `Completed: ${uniqueCompleted.length}\n`
  
  if (uniqueCompleted.length > 0) {
    message += `\n✅ Done:\n`
    uniqueCompleted.forEach(item => {
      message += `  • ${item.title}\n`
    })
  }
  
  if (uniqueSkipped.length > 0) {
    message += `\n⚠️ Skipped:\n`
    uniqueSkipped.forEach(item => {
      message += `  • ${item.title}\n`
    })
  } else {
    message += `\n✅ All checks passed!\n`
  }
  
  message += `\n━━━━━━━━━━━━━━━━━━━━\n`
  message += `🔗 https://digiget.uk\n`
  
  return message
}

// Detect if we're on a mobile device
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         (window.innerWidth <= 768)
}

const handleShare = async () => {
  const message = formatShareMessage()
  const shareData = {
    title: 'Shift Handover Report',
    text: message
  }

  // On mobile: Try Web Share API first (shows WhatsApp in native share sheet)
  if (navigator.share && isMobile()) {
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
  
  // Desktop or Web Share API not available: Show share options modal
  // On mobile, this will also show WhatsApp as the first option
  showShareModal.value = true
}

const shareViaWhatsApp = () => {
  const message = formatShareMessage()
  const encodedMessage = encodeURIComponent(message)
  // Use wa.me for universal WhatsApp sharing (works on mobile and desktop)
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
  
  // On mobile, try to open WhatsApp app directly
  if (isMobile()) {
    // Try WhatsApp app first (whatsapp://)
    const whatsappAppUrl = `whatsapp://send?text=${encodedMessage}`
    window.location.href = whatsappAppUrl
    
    // Fallback to web if app doesn't open (after a short delay)
    setTimeout(() => {
      window.open(whatsappUrl, '_blank')
    }, 500)
  } else {
    // Desktop: open WhatsApp Web
    window.open(whatsappUrl, '_blank')
  }
  
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

const handleContact = () => {
  const email = 'hello@digiget.uk'
  
  // Show email in alert first, then try to open email client
  alert(`Contact us at: ${email}`)
  
  // Try to open email client
  const mailtoLink = `mailto:${email}?subject=Digiget App Inquiry`
  window.location.href = mailtoLink
  
  // Fallback: copy email to clipboard
  setTimeout(async () => {
    try {
      await navigator.clipboard.writeText(email)
    } catch (err) {
      console.error('Failed to copy email:', err)
    }
  }, 500)
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
  /* Don't take full height - allow footer to be visible */
  min-height: auto;
  width: 100%;
  max-width: 28rem; /* Match card-stack-container max-w-sm */
  /* Ensure content flows naturally */
  padding-bottom: 1rem;
}

.confetti-canvas {
  @apply fixed inset-0 pointer-events-none z-50;
  width: 100vw;
  height: 100vh;
}

.header-section {
  @apply flex-none flex flex-col items-center justify-center py-4 relative z-10;
  /* Reduced padding to save space for footer */
}

.success-icon {
  @apply text-green-500 mb-4 flex items-center justify-center;
  animation: scaleIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  /* Ensure proper alignment */
  width: 100%;
}

.success-title {
  @apply text-3xl font-bold text-zinc-100 mb-1 text-center leading-tight;
}

.success-message {
  @apply text-lg font-medium text-center text-zinc-400 px-4;
}

/* Completed Items Section */
.completed-list-section {
  @apply flex-none w-full max-w-md px-6 mb-4 relative z-10;
  /* Limit height on mobile to ensure buttons and footer are visible */
  max-height: 30vh;
  overflow: hidden;
}

/* Scrollable Review List */
.review-list {
  @apply w-full overflow-y-auto px-2 mb-4 scrollbar-hide relative z-10;
  /* Reduced max height to ensure share button and footer are always visible on mobile */
  max-height: 25vh;
  mask-image: linear-gradient(to bottom, transparent, black 5%, black 95%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 5%, black 95%, transparent);
}

.list-header {
  @apply text-xs uppercase tracking-wider text-zinc-500 font-bold mb-3 text-center;
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
.review-item:nth-child(6) { animation-delay: 0.35s; }
.review-item:nth-child(7) { animation-delay: 0.4s; }
.review-item:nth-child(8) { animation-delay: 0.45s; }

.review-item.completed {
  @apply border-green-900/30 bg-green-950/10;
}

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
  @apply flex-none w-full flex flex-col items-center pb-6 pt-2 relative z-10 px-4;
  /* Ensure buttons are always visible on mobile */
  min-height: fit-content;
  /* Reduced padding to allow footer to be visible */
  padding-bottom: 1rem;
  /* Ensure it's not hidden behind other elements */
  position: relative;
}

/* Three Equal Buttons Row */
.buttons-row {
  @apply flex w-full max-w-xs gap-2 mb-4 items-stretch;
}

/* Base action button style */
.action-button {
  @apply flex-1 font-bold py-3 px-4 rounded-xl shadow-lg 
         active:scale-95 transition-all 
         flex items-center justify-center gap-1.5 
         min-h-[48px] text-sm;
}

/* Share button - WhatsApp-like green */
.action-button.share-button {
  @apply bg-green-600 hover:bg-green-500 text-white !important;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
}

.share-button:active {
  transform: scale(0.98);
}

/* New button - blue */
.action-button.new-button {
  @apply bg-blue-600 hover:bg-blue-500 text-white !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.new-button:active {
  transform: scale(0.98);
}

/* Edit button - slight orange/orangey background */
.action-button.edit-button {
  @apply bg-orange-600 hover:bg-orange-500 text-white !important;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.3);
}

.edit-button:active {
  transform: scale(0.98);
}

/* Contact button - purple/violet background */
.action-button.contact-button {
  @apply bg-purple-600 hover:bg-purple-500 text-white !important;
  box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
  /* Smaller button to fit under New */
  min-height: 40px;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
}

.contact-button:active {
  transform: scale(0.98);
}

/* Container for New and Contact buttons */
.buttons-row > div.flex-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

/* Legacy button styles removed - using new action-button styles */

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
