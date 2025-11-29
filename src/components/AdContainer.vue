<template>
  <div v-if="currentAd && validLink" class="ad-container fade-in">
    <!-- Type: Simple Text Ad -->
    <a 
      v-if="currentAd.type === 'text'"
      :href="validLink" 
      target="_blank" 
      rel="noopener noreferrer"
      class="ad-text-link"
      @click="handleAdClick"
    >
      <span class="ad-badge">Sponsored</span>
      <div class="flex-1 min-w-0">
        <p class="ad-content">{{ currentAd.content }}</p>
        <p class="ad-link-url">{{ formatLink(validLink) }}</p>
      </div>
      <ExternalLink :size="14" class="text-zinc-500 flex-shrink-0" />
    </a>

    <!-- Type: Affiliate / Banner Ad -->
    <a 
      v-else-if="currentAd.type === 'affiliate'"
      :href="validLink"
      target="_blank"
      rel="noopener noreferrer"
      class="ad-banner group"
      @click="handleAdClick"
    >
      <div v-if="currentAd.imageUrl" class="ad-image-wrapper">
        <img :src="currentAd.imageUrl" alt="Ad" class="ad-image" />
      </div>
      <div class="ad-details">
        <span class="ad-badge-sm">Promoted</span>
        <h4 class="ad-title">{{ currentAd.content }}</h4>
        <p class="ad-link-url-small">{{ formatLink(validLink) }}</p>
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
import { ref, onMounted, computed } from 'vue'
import { ExternalLink, ArrowRight } from 'lucide-vue-next'
import { db } from '../firebase'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'

const props = defineProps({
  currentShift: {
    type: String,
    default: 'Day'
  }
})

const currentAd = ref(null)
const userLocation = ref({ city: 'Unknown', region: 'Unknown', country: 'Unknown' })

// Ensure link has proper protocol
const validLink = computed(() => {
  if (!currentAd.value?.link) return null
  const link = currentAd.value.link.trim()
  if (!link) return null
  
  // Add https:// if no protocol
  if (!link.startsWith('http://') && !link.startsWith('https://')) {
    return `https://${link}`
  }
  return link
})

const handleAdClick = (e) => {
  if (!validLink.value) {
    e.preventDefault()
    e.stopPropagation()
    console.error("Invalid ad link:", currentAd.value?.link)
    alert("This ad has an invalid link. Please contact support.")
    return false
  }
  // Log for debugging - let the natural link behavior work
  console.log("Ad clicked, navigating to:", validLink.value)
  // Don't prevent default - let the <a> tag handle navigation naturally
  return true
}

const formatLink = (link) => {
  if (!link) return ''
  // Remove protocol for display
  return link.replace(/^https?:\/\//, '').replace(/^www\./, '')
}

// Get user location
const getUserLocation = async () => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    
    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(timeoutId)
    
    const data = await response.json()
    userLocation.value = {
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country: data.country_name || 'Unknown'
    }
  } catch (error) {
    console.warn('Location fetch failed:', error)
    // Keep default Unknown values
  }
}

// Check if ad matches targeting criteria
const matchesTargeting = (ad) => {
  // If no targeting set, show to everyone
  if (!ad.targetCity && !ad.targetRegion && (!ad.targetShifts || ad.targetShifts.length === 0)) {
    return true
  }
  
  // Check location targeting
  if (ad.targetCity && ad.targetCity.toLowerCase() !== userLocation.value.city.toLowerCase()) {
    return false
  }
  
  if (ad.targetRegion && ad.targetRegion.toLowerCase() !== userLocation.value.region.toLowerCase()) {
    return false
  }
  
  // Check shift targeting
  if (ad.targetShifts && ad.targetShifts.length > 0) {
    if (!ad.targetShifts.includes(props.currentShift)) {
      return false
    }
  }
  
  return true
}

onMounted(async () => {
  // Get user location first
  await getUserLocation()
  
  try {
    // Fetch active ads - query without orderBy to avoid index requirements
    // We'll sort client-side instead
    const q = query(
      collection(db, "ads"),
      where("isActive", "==", true),
      limit(20) // Get more ads to sort client-side
    )
    const snapshot = await getDocs(q)
    
    const ads = snapshot.docs.map(doc => {
      const data = doc.data()
      return { 
        id: doc.id, 
        ...data,
        // Ensure createdAt exists (fallback for old ads)
        createdAt: data.createdAt || { seconds: 0, nanoseconds: 0 }
      }
    })
    
    // Filter to only active ads, match targeting, and sort by createdAt client-side
    const activeAds = ads
      .filter(ad => ad.isActive === true)
      .filter(ad => matchesTargeting(ad)) // Apply targeting filter
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        const aTime = a.createdAt?.seconds || 0
        const bTime = b.createdAt?.seconds || 0
        return bTime - aTime
      })
      .slice(0, 10) // Take top 10 after sorting
    
    if (activeAds.length > 0) {
      // Pick a random ad from the active pool to keep it fresh
      const randomIndex = Math.floor(Math.random() * activeAds.length)
      currentAd.value = activeAds[randomIndex]
      console.log("Ad loaded:", {
        content: currentAd.value.content,
        link: currentAd.value.link,
        type: currentAd.value.type,
        targeting: {
          city: currentAd.value.targetCity,
          region: currentAd.value.targetRegion,
          shifts: currentAd.value.targetShifts
        },
        userLocation: userLocation.value,
        userShift: props.currentShift,
        validLink: validLink.value
      })
    } else {
      console.log("No matching ads found for current location/shift")
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
  @apply flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 hover:bg-zinc-800 transition-colors no-underline cursor-pointer;
  text-decoration: none !important;
}

.ad-badge {
  @apply text-[10px] font-bold uppercase text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800;
}

.ad-content {
  @apply text-sm text-zinc-300 font-medium flex-1 truncate;
}

.ad-link-url {
  @apply text-[10px] text-zinc-600 mt-1 truncate;
}

.ad-link-url-small {
  @apply text-[9px] text-zinc-600 mb-1 truncate;
}

/* Banner/Affiliate Ad Styles */
.ad-banner {
  @apply flex bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all no-underline h-24 cursor-pointer;
  text-decoration: none !important;
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
