<template>
  <button 
    v-if="canUndo"
    @click="$emit('undo')"
    class="undo-button"
    aria-label="Undo last swipe"
  >
    <RotateCcw :size="20" />
  </button>
</template>

<script setup>
import { RotateCcw } from 'lucide-vue-next'

defineProps({
  canUndo: {
    type: Boolean,
    default: false
  }
})

defineEmits(['undo'])
</script>

<style scoped>
.undo-button {
  @apply fixed bottom-6 left-1/2 transform -translate-x-1/2 
         bg-zinc-900 border border-zinc-800 rounded-full p-3
         text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800
         transition-colors shadow-lg;
  z-index: 100;
  cursor: pointer;
}

.undo-button:active {
  @apply bg-zinc-800;
}
</style>




