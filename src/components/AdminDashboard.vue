<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <div>
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <Database :size="24" class="text-blue-500" />
          Car Park Control
        </h2>
        <div class="flex gap-4 mt-2 text-sm">
          <button 
            @click="activeTab = 'logs'" 
            class="pb-1 transition-colors"
            :class="activeTab === 'logs' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-zinc-500 hover:text-zinc-300'"
          >
            System Logs
          </button>
          <button 
            @click="activeTab = 'ads'" 
            class="pb-1 transition-colors"
            :class="activeTab === 'ads' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-zinc-500 hover:text-zinc-300'"
          >
            Ad Manager
          </button>
        </div>
      </div>
      <button @click="$emit('close')" class="exit-btn">
        <LogOut :size="20" />
      </button>
    </div>

    <!-- LOGS TAB -->
    <div v-if="activeTab === 'logs'" class="table-container">
      <div v-if="loadingLogs" class="p-8 text-center text-zinc-500">
        Loading diagnostic data...
      </div>
      
      <div v-else-if="logs.length === 0" class="p-8 text-center text-zinc-500">
        No logs found.
      </div>

      <table v-else class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-zinc-900 border-b border-zinc-800 text-xs uppercase text-zinc-500 font-bold tracking-wider">
          <tr>
            <th class="p-4">Time</th>
            <th class="p-4">User ID</th>
            <th class="p-4 text-center">Status</th>
            <th class="p-4">Skipped Items</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/50">
          <tr v-for="log in logs" :key="log.id" class="hover:bg-zinc-900/50 transition-colors text-sm">
            <td class="p-4 text-zinc-300 whitespace-nowrap">
              {{ formatTime(log.timestamp) }}
              <div class="text-xs text-zinc-600">{{ formatDate(log.timestamp) }}</div>
            </td>
            <td class="p-4 font-mono text-zinc-500 text-xs">
              {{ log.userId ? log.userId.slice(0, 8) + '...' : 'Anon' }}
            </td>
            <td class="p-4 text-center">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-900/50">
                {{ log.itemsChecked || 0 }} Checked
              </span>
            </td>
            <td class="p-4">
              <div v-if="log.skippedItems && log.skippedItems.length > 0" class="flex flex-wrap gap-1">
                <span 
                  v-for="(item, i) in log.skippedItems" 
                  :key="i"
                  class="text-xs px-2 py-0.5 rounded bg-red-900/20 text-red-400 border border-red-900/30"
                >
                  {{ item }}
                </span>
              </div>
              <span v-else class="text-zinc-700 text-xs italic">All Clear</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ADS TAB -->
    <div v-if="activeTab === 'ads'" class="p-6 overflow-y-auto flex-1">
      <!-- Create New Ad Form -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h3 class="text-lg font-bold text-white mb-4">Create New Promotion</h3>
        
        <div class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Type</label>
              <select v-model="newAd.type" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300">
                <option value="text">Simple Text</option>
                <option value="affiliate">Affiliate / Banner</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
              <select v-model="newAd.isActive" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300">
                <option :value="true">Active</option>
                <option :value="false">Draft (Hidden)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">
              {{ newAd.type === 'text' ? 'Message Text' : 'Banner Title / Headline' }}
            </label>
            <input v-model="newAd.content" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white" placeholder="e.g. 50% Off Nursing Shoes" />
          </div>

          <div v-if="newAd.type === 'affiliate'">
             <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Image URL (Optional)</label>
             <input v-model="newAd.imageUrl" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white" placeholder="https://example.com/image.jpg" />
          </div>

          <div>
            <label class="block text-xs font-bold text-zinc-500 uppercase mb-1">Target Link (URL)</label>
            <input v-model="newAd.link" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white" placeholder="https://amazon.com/..." />
          </div>

          <button 
            @click="createNewAd" 
            :disabled="isSavingAd"
            class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg mt-2 disabled:opacity-50"
          >
            {{ isSavingAd ? 'Publishing...' : 'Publish Ad' }}
          </button>
        </div>
      </div>

      <!-- Existing Ads List -->
      <h3 class="text-lg font-bold text-white mb-4">Active Campaigns</h3>
      <div v-if="loadingAds" class="text-zinc-500">Loading campaigns...</div>
      <div v-else class="space-y-4">
        <div v-for="ad in ads" :key="ad.id" class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center group">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span 
                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                :class="ad.isActive ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-zinc-800 text-zinc-500'"
              >
                {{ ad.isActive ? 'LIVE' : 'PAUSED' }}
              </span>
              <span class="text-xs text-zinc-500 uppercase">{{ ad.type }}</span>
            </div>
            <h4 class="font-bold text-zinc-200">{{ ad.content }}</h4>
            <a :href="ad.link" target="_blank" class="text-xs text-blue-400 hover:underline truncate block max-w-md">{{ ad.link }}</a>
          </div>
          
          <div class="flex items-center gap-2">
            <button 
              @click="toggleAdStatus(ad)"
              class="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Toggle Active Status"
            >
              <Power :size="18" :class="ad.isActive ? 'text-green-400' : 'text-zinc-500'" />
            </button>
            <button 
              @click="deleteAd(ad.id)"
              class="p-2 rounded-lg bg-zinc-800 hover:bg-red-900/30 text-zinc-400 hover:text-red-400 transition-colors"
              title="Delete Campaign"
            >
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
        <div v-if="ads.length === 0" class="text-zinc-600 text-sm text-center py-8">
          No active ad campaigns.
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Database, LogOut, Trash2, Power } from 'lucide-vue-next'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, limit, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

const emit = defineEmits(['close'])

const activeTab = ref('logs') // 'logs' or 'ads'

// Logs Data
const logs = ref([])
const loadingLogs = ref(true)
let logsUnsubscribe = null

// Ads Data
const ads = ref([])
const loadingAds = ref(true)
const isSavingAd = ref(false)
let adsUnsubscribe = null

// New Ad Form State
const newAd = ref({
  type: 'text',
  content: '',
  link: '',
  imageUrl: '',
  isActive: true
})

onMounted(() => {
  // 1. Fetch Logs
  const logsQuery = query(
    collection(db, "shift_logs"),
    orderBy("timestamp", "desc"),
    limit(50)
  )

  logsUnsubscribe = onSnapshot(logsQuery, (snapshot) => {
    logs.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    loadingLogs.value = false
  }, (error) => {
    console.error("Logs Access Error:", error)
    loadingLogs.value = false
  })

  // 2. Fetch Ads
  const adsQuery = query(
    collection(db, "ads"),
    orderBy("createdAt", "desc")
  )

  adsUnsubscribe = onSnapshot(adsQuery, (snapshot) => {
    ads.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    loadingAds.value = false
  })
})

onUnmounted(() => {
  if (logsUnsubscribe) logsUnsubscribe()
  if (adsUnsubscribe) adsUnsubscribe()
})

// --- Ad Actions ---

const createNewAd = async () => {
  if (!newAd.value.content || !newAd.value.link) {
    alert("Please fill in Content and Link fields.")
    return
  }

  isSavingAd.value = true
  try {
    await addDoc(collection(db, "ads"), {
      ...newAd.value,
      createdAt: serverTimestamp()
    })
    
    // Reset Form
    newAd.value = {
      type: 'text',
      content: '',
      link: '',
      imageUrl: '',
      isActive: true
    }
    alert("Campaign published successfully.")
  } catch (e) {
    console.error("Error creating ad:", e)
    alert("Failed to publish ad. Check console.")
  } finally {
    isSavingAd.value = false
  }
}

const toggleAdStatus = async (ad) => {
  try {
    const adRef = doc(db, "ads", ad.id)
    await updateDoc(adRef, {
      isActive: !ad.isActive
    })
  } catch (e) {
    console.error("Error toggling ad:", e)
  }
}

const deleteAd = async (id) => {
  if (!confirm("Are you sure you want to delete this campaign?")) return
  try {
    await deleteDoc(doc(db, "ads", id))
  } catch (e) {
    console.error("Error deleting ad:", e)
  }
}

// Formatters
const formatTime = (timestamp) => {
  if (!timestamp) return '--:--'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.admin-dashboard {
  @apply fixed inset-0 bg-zinc-950 z-[100] flex flex-col;
  animation: fadeIn 0.3s ease-out;
}

.dashboard-header {
  @apply flex justify-between items-start p-6 border-b border-zinc-900 bg-zinc-950;
}

.exit-btn {
  @apply p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors;
}

.table-container {
  @apply flex-1 overflow-auto;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
