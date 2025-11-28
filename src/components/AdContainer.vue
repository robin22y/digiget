<template>
  <div v-if="currentAd" class="ad-container fade-in">
    <!-- Type: Simple Text Ad -->
    <a 
      v-if="currentAd.type === 'text'"
      :href="currentAd.link" 
      target="_blank" 
      rel="noopener noreferrer"
      class="ad-text-link"
    >
      <span class="ad-badge">Sponsored</span>
      <p class="ad-content">{{ currentAd.content }}</p>
      <ExternalLink :size="14" class="text-zinc-500" />
    </a>

    <!-- Type: Affiliate / Banner Ad -->
    <a 
      v-else-if="currentAd.type === 'affiliate'"
      :href="currentAd.link"
      target="_blank"
      rel="noopener noreferrer"
      class="ad-banner group"
    >
      <div v-if="currentAd.imageUrl" class="ad-image-wrapper">
        <img :src="currentAd.imageUrl" alt="Ad" class="ad-image" />
      </div>
      <div class="ad-details">
        <span class="ad-badge-sm">Promoted</span>
        <h4 class="ad-title">{{ currentAd.content }}</h4>
        <div class="ad-cta">
          Shop Now <ArrowRight :size="12" />
        </div>
      </div>
    </a>
  </div>
  
  <!-- Fallback (Hidden if no ads, or showing support link) -->
  <div v-else class="hidden"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ExternalLink, ArrowRight } from 'lucide-vue-next'
import { db } from '../firebase'
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore'

const currentAd = ref(null)

onMounted(async () => {
  try {
    // Fetch active ads
    const q = query(
      collection(db, "ads"),
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
      limit(5) // Get latest 5 active ads
    )
    
    const snapshot = await getDocs(q)
    const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    if (ads.length > 0) {
      // Pick a random ad from the active pool to keep it fresh
      const randomIndex = Math.floor(Math.random() * ads.length)
      currentAd.value = ads[randomIndex]
    }
  } catch (e) {
    console.error("Failed to load ads:", e)
    // Fail silently (show nothing)
  }
})
</script>

<style scoped>
.ad-container {
  @apply w-full max-w-sm mt-6 mb-2 px-4;
  animation: fadeIn 0.5s ease-out;
}

/* Text Ad Styles */
.ad-text-link {
  @apply flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 hover:bg-zinc-800 transition-colors no-underline;
}

.ad-badge {
  @apply text-[10px] font-bold uppercase text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800;
}

.ad-content {
  @apply text-sm text-zinc-300 font-medium flex-1 truncate;
}

/* Banner/Affiliate Ad Styles */
.ad-banner {
  @apply flex bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all no-underline h-24;
}

.ad-image-wrapper {
  @apply w-24 h-full bg-zinc-950 flex-shrink-0;
}

.ad-image {
  @apply w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity;
}

.ad-details {
  @apply flex-1 p-3 flex flex-col justify-center;
}

.ad-badge-sm {
  @apply text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1 block;
}

.ad-title {
  @apply text-sm font-bold text-white leading-tight mb-2 line-clamp-2;
}

.ad-cta {
  @apply text-xs font-bold text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
