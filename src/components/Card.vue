<template>
  <div class="card">
    <slot></slot>
  </div>
</template>

<script setup>
// Generic Card component for future content
</script>

<style scoped>
.card {
  @apply bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-lg;
  transition: all 0.2s ease;
}

.card:hover {
  @apply border-zinc-700;
}
</style>

