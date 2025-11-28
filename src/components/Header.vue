<template>
  <header class="header">
    <!-- Secret Trigger Area -->
    <h1 
      class="brand-name select-none" 
      @click="handleSecretClick"
    >
      Digiget
    </h1>

    <button 
      class="add-button"
      @click="$emit('add-click')"
      aria-label="Add Card"
    >
      <Plus :size="24" />
    </button>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'

const emit = defineEmits(['add-click', 'admin-trigger'])

// Secret Click Logic
const clickCount = ref(0)
const lastClickTime = ref(0)

const handleSecretClick = () => {
  const now = Date.now()
  
  // Reset if more than 1 second has passed since last click
  if (now - lastClickTime.value > 1000) {
    clickCount.value = 0
  }
  
  lastClickTime.value = now
  clickCount.value++
  
  // 5 Clicks to trigger
  if (clickCount.value === 5) {
    emit('admin-trigger')
    clickCount.value = 0
  }
}
</script>

<style scoped>
.header {
  @apply flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-900;
}

.brand-name {
  @apply text-2xl font-semibold text-zinc-100 tracking-tight cursor-default;
}

.add-button {
  @apply p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-800;
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
