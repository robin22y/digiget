<template>
  <div class="shift-review">
    <div class="review-header">
      <div class="warning-icon">
        <AlertTriangle :size="48" />
      </div>
      <h2 class="review-title">Quick Safety Review</h2>
      <p class="review-subtitle">You swiped left on these items. Do you need to do them?</p>
    </div>

    <div class="review-list">
      <div 
        v-for="item in skippedItems" 
        :key="item.id"
        class="review-item skipped"
      >
        <div class="item-icon-wrapper bg-amber-900/30 border border-amber-800/50">
          <AlertTriangle :size="20" class="text-amber-400" />
        </div>
        <span class="item-text">{{ item.title }}</span>
      </div>
    </div>

    <div class="review-actions">
      <button 
        @click="handleRetry"
        class="action-button retry-button"
      >
        Do Them Now
      </button>
      <button 
        @click="handleConfirm"
        class="action-button confirm-button"
      >
        Mark as N/A
      </button>
    </div>
  </div>
</template>

<script setup>
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  completedItems: {
    type: Array,
    default: () => []
  },
  skippedItems: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['retry', 'confirm'])

const handleRetry = () => {
  emit('retry')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<style scoped>
.shift-review {
  @apply flex flex-col items-center h-full w-full max-h-full p-6;
  animation: fadeIn 0.3s ease-in;
}

.review-header {
  @apply flex flex-col items-center mb-6 text-center;
}

.warning-icon {
  @apply text-amber-500 mb-4;
  animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.review-title {
  @apply text-2xl font-bold text-white mb-2;
}

.review-subtitle {
  @apply text-zinc-400 text-sm px-4;
}

.review-list {
  @apply flex-1 w-full overflow-y-auto px-2 mb-6 scrollbar-hide;
  mask-image: linear-gradient(to bottom, transparent, black 5%, black 95%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 5%, black 95%, transparent);
}

.review-item {
  @apply flex items-center gap-3 p-4 mb-3 rounded-xl bg-zinc-900 border border-amber-800/30;
  animation: slideUp 0.4s ease-out forwards;
  opacity: 0;
}

.review-item.skipped {
  @apply bg-amber-950/20 border-amber-800/50;
}

/* Stagger animation for list items */
.review-item:nth-child(1) { animation-delay: 0.1s; }
.review-item:nth-child(2) { animation-delay: 0.15s; }
.review-item:nth-child(3) { animation-delay: 0.2s; }
.review-item:nth-child(4) { animation-delay: 0.25s; }
.review-item:nth-child(5) { animation-delay: 0.3s; }
.review-item:nth-child(6) { animation-delay: 0.35s; }

.item-icon-wrapper {
  @apply w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0;
}

.item-text {
  @apply text-sm font-medium text-zinc-300;
}

.review-actions {
  @apply flex flex-col gap-3 w-full max-w-sm;
}

.action-button {
  @apply w-full py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95;
}

.retry-button {
  @apply bg-white text-zinc-950 hover:bg-zinc-100;
}

.confirm-button {
  @apply bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white;
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



