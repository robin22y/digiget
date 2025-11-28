<template>
  <div v-if="showAd" class="ad-container">
    <div class="ad-content">
      <p class="ad-text">Support Digiget</p>
      <!-- Ad code will be inserted here in the future -->
      <!-- <div id="ad-slot"></div> -->
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Control whether ad is shown
// Set to false if ad fails to load or no ad code is provided
// When false, the container will be completely hidden (display: none via v-if)
const showAd = ref(true) // Set to false to hide the container completely

// Future: Add ad loading logic here
// Example:
// onMounted(async () => {
//   try {
//     // Load ad script
//     // await loadAdScript()
//     showAd.value = true
//   } catch (error) {
//     // If ad fails to load, hide the container
//     showAd.value = false
//   }
// })
</script>

<style scoped>
.ad-container {
  @apply w-full flex items-center justify-center mt-8;
  /* Fixed size for standard ad units */
  /* 320x50px (banner) or 300x250px (medium rectangle) */
  min-height: 0;
}

.ad-content {
  @apply bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center;
  /* Standard banner size */
  width: 320px;
  height: 50px;
  /* Alternative: Medium rectangle size */
  /* width: 300px;
  height: 250px; */
}

.ad-text {
  @apply text-zinc-500 text-sm font-medium;
}
</style>

