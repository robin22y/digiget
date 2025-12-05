<template>
  <Transition name="fade">
    <div v-if="notice" class="notice-backdrop" @click.self="handleDismiss">
      <div class="notice-modal">
        <div class="notice-header">
          <div class="flex items-center gap-2">
            <Bell :size="24" class="text-blue-400" />
            <h3 class="text-xl font-bold text-white">{{ notice.title || 'Update' }}</h3>
          </div>
          <button @click="handleDismiss" class="close-btn">
            <X :size="20" />
          </button>
        </div>
        
        <div class="notice-body">
          <div class="notice-content" v-html="formattedContent"></div>
          
          <div v-if="notice.link" class="notice-link-section">
            <a 
              :href="notice.link" 
              target="_blank" 
              class="notice-link"
            >
              {{ notice.link_text || 'Learn More' }}
              <ExternalLink :size="16" />
            </a>
          </div>
        </div>
        
        <div class="notice-footer">
          <button 
            @click="handleDismiss" 
            class="dismiss-btn"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { Bell, X, ExternalLink } from 'lucide-vue-next'

const props = defineProps({
  notice: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['dismiss'])

const formattedContent = computed(() => {
  if (!props.notice?.content) return ''
  // Convert line breaks to <br> tags for better formatting
  return props.notice.content.replace(/\n/g, '<br>')
})

const handleDismiss = () => {
  if (props.notice?.id) {
    // Mark notice as seen in localStorage
    const seenNotices = JSON.parse(localStorage.getItem('digiget_seen_notices') || '[]')
    const noticeIdStr = String(props.notice.id)
    // Check both string and number format for compatibility
    if (!seenNotices.includes(noticeIdStr) && !seenNotices.includes(props.notice.id)) {
      seenNotices.push(noticeIdStr) // Store as string for consistency
      localStorage.setItem('digiget_seen_notices', JSON.stringify(seenNotices))
    }
  }
  emit('dismiss')
}
</script>

<style scoped>
.notice-backdrop {
  @apply fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4;
  animation: fadeIn 0.2s ease-out;
}

.notice-modal {
  @apply bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.notice-header {
  @apply flex justify-between items-center p-5 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur;
}

.close-btn {
  @apply p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors;
}

.notice-body {
  @apply p-6 overflow-y-auto flex-1;
}

.notice-content {
  @apply text-zinc-300 leading-relaxed;
  line-height: 1.6;
}

.notice-link-section {
  @apply mt-4 pt-4 border-t border-zinc-800;
}

.notice-link {
  @apply flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors;
}

.notice-footer {
  @apply p-5 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur;
}

.dismiss-btn {
  @apply w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px) scale(0.95); 
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1); 
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

