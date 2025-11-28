<template>
  <header class="header">
    <div class="brand-container" @click="handleSecretClick">
      <div class="brand-logo-wrapper">
        <img src="/logo.svg" alt="Digiget Logo" class="brand-logo" />
      </div>
      <div class="brand-text">
        <h1 class="brand-name">Digiget</h1>
        <span class="brand-subtitle">DID I GET EVERYTHING TODAY?</span>
      </div>
    </div>

    <div class="actions">
      <!-- Install Icon -->
      <button 
        class="action-button install-mini"
        :class="{ 'install-available': canInstall }"
        @click="$emit('install')"
        aria-label="Install App"
        :title="canInstall ? 'Install App' : 'Install not available'"
        :disabled="!canInstall"
      >
        <Download :size="18" />
      </button>

      <button 
        class="action-button add-btn"
        @click="$emit('add-click')"
        aria-label="Add Card"
      >
        <Plus :size="24" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { Plus, Download } from 'lucide-vue-next'

defineProps({
  canInstall: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add-click', 'admin-trigger', 'install'])

// Secret Click Logic (5 clicks = Admin)
const clickCount = ref(0)
const lastClickTime = ref(0)

const handleSecretClick = () => {
  const now = Date.now()
  if (now - lastClickTime.value > 1000) clickCount.value = 0
  lastClickTime.value = now
  clickCount.value++
  
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

.brand-container {
  @apply flex items-center gap-3 cursor-default select-none;
}

.brand-logo-wrapper {
  @apply flex items-center justify-center;
}

.brand-logo {
  @apply w-10 h-10;
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
}

.brand-text {
  @apply flex flex-col justify-center;
}

.brand-name {
  @apply text-2xl font-bold text-zinc-100 tracking-tight leading-none;
}

.brand-subtitle {
  @apply text-[0.65rem] font-bold text-zinc-500 tracking-widest mt-1;
}

.actions {
  @apply flex items-center gap-3;
}

.action-button {
  @apply p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-800 flex items-center justify-center;
  cursor: pointer;
  min-width: 40px;
  min-height: 40px;
}

.install-mini {
  @apply text-zinc-500 border-zinc-800 bg-zinc-900;
}

.install-mini.install-available {
  @apply text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/50;
}

.install-mini:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
