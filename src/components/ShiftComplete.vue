<template>
  <div class="shift-complete">
    <div class="success-content">
      <div class="success-icon">
        <CheckCircle :size="80" />
      </div>
      <h1 class="success-title">Shift Complete</h1>
      <p class="success-message">All safety checks completed</p>
    </div>
    <AdContainer />
  </div>
</template>

<script setup>
import { CheckCircle } from 'lucide-vue-next'
import AdContainer from './AdContainer.vue'
</script>

<style scoped>
.shift-complete {
  @apply flex flex-col items-center justify-center gap-6 p-8 h-full w-full;
  animation: fadeIn 0.5s ease-in;
}

.success-content {
  @apply flex flex-col items-center justify-center gap-6;
}

.success-icon {
  @apply text-green-400;
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.success-title {
  @apply text-4xl font-bold text-zinc-100;
}

.success-message {
  @apply text-xl text-zinc-400;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

