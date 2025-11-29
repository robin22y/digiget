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
            @click="activeTab = 'metrics'" 
            class="pb-1 transition-colors"
            :class="activeTab === 'metrics' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-zinc-500 hover:text-zinc-300'"
          >
            Metrics
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
      <div class="flex gap-2">
        <button @click="$emit('close')" class="exit-btn">
          <LogOut :size="20" />
        </button>
      </div>
    </div>

    <!-- METRICS TAB (Cockpit Dashboard) -->
    <div v-if="activeTab === 'metrics'" class="p-6 overflow-y-auto flex-1">
      <div v-if="loadingMetrics" class="p-8 text-center text-zinc-500">
        Calculating metrics...
      </div>
      
      <div v-else class="space-y-6">
        <!-- Key Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Users -->
          <div class="metric-card">
            <div class="metric-header">
              <Users :size="20" class="text-blue-400" />
              <span class="metric-label">Total Users</span>
            </div>
            <div class="metric-value">{{ metrics.totalUsers.toLocaleString() }}</div>
            <div class="metric-change" :class="metrics.newUsersToday > 0 ? 'text-green-400' : 'text-zinc-500'">
              {{ metrics.newUsersToday > 0 ? '+' : '' }}{{ metrics.newUsersToday }} today
            </div>
          </div>

          <!-- Active Today (DAU) -->
          <div class="metric-card">
            <div class="metric-header">
              <Activity :size="20" class="text-green-400" />
              <span class="metric-label">Active Today</span>
            </div>
            <div class="metric-value">{{ metrics.dau.toLocaleString() }}</div>
            <div class="metric-change" :class="getEngagementClass(metrics.dau)">
              {{ getEngagementText(metrics.dau) }}
            </div>
          </div>

          <!-- Crashes -->
          <div class="metric-card">
            <div class="metric-header">
              <AlertTriangle :size="20" class="text-yellow-400" />
              <span class="metric-label">Crashes</span>
            </div>
            <div class="metric-value">{{ metrics.crashes }}</div>
            <div class="metric-change" :class="metrics.crashes === 0 ? 'text-green-400' : 'text-red-400'">
              {{ metrics.crashes === 0 ? 'System Healthy' : 'Investigate' }}
            </div>
          </div>

          <!-- Completion Rate -->
          <div class="metric-card">
            <div class="metric-header">
              <CheckCircle :size="20" class="text-purple-400" />
              <span class="metric-label">Completion Rate</span>
            </div>
            <div class="metric-value">{{ metrics.completionRate }}%</div>
            <div class="metric-change text-zinc-500">
              {{ metrics.completedSessions }} / {{ metrics.totalSessions }} sessions
            </div>
          </div>
        </div>

        <!-- Retention Metric (DAU/MAU) -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp :size="20" class="text-blue-400" />
            Retention (Stickiness)
          </h3>
          <div class="flex items-end gap-6">
            <div>
              <div class="text-4xl font-bold text-white">{{ metrics.retentionRate }}%</div>
              <div class="text-sm text-zinc-500 mt-1">DAU / MAU Ratio</div>
            </div>
            <div class="flex-1">
              <div class="text-sm text-zinc-400 mb-2">
                <span class="text-green-400 font-bold">{{ metrics.dau }}</span> Daily Active Users / 
                <span class="text-blue-400 font-bold">{{ metrics.mau }}</span> Monthly Active Users
              </div>
              <div class="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                  :style="{ width: `${metrics.retentionRate}%` }"
                ></div>
              </div>
            </div>
          </div>
          <div class="mt-4 text-xs text-zinc-500">
            {{ getRetentionStatus(metrics.retentionRate) }}
          </div>
        </div>

        <!-- Growth Chart (Last 30 Days) -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 :size="20" class="text-green-400" />
            New User Growth (Last 30 Days)
          </h3>
          <div class="h-48 flex items-end gap-1">
            <div 
              v-for="(day, index) in metrics.growthData" 
              :key="index"
              class="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-500 hover:to-blue-300 transition-colors cursor-pointer group relative"
              :style="{ height: `${Math.max((day / metrics.maxDailyGrowth) * 100, 5)}%` }"
              :title="`${day} new users on ${formatChartDate(index)}`"
            >
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {{ day }} users
              </div>
            </div>
          </div>
          <div class="flex justify-between mt-2 text-xs text-zinc-500">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        <!-- Geography (Placeholder) -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe :size="20" class="text-purple-400" />
            User Geography
          </h3>
          <div class="text-zinc-400 text-sm">
            <p>Geographic data collection coming soon.</p>
            <p class="text-zinc-600 text-xs mt-2">This will show where your users are located (e.g., London, Mumbai, NYC)</p>
          </div>
        </div>
      </div>
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
      <h3 class="text-lg font-bold text-white mb-4">All Campaigns</h3>
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
            <h4 class="font-bold text-zinc-200 mb-1">{{ ad.content }}</h4>
            <a :href="ad.link" target="_blank" class="text-xs text-blue-400 hover:underline truncate block max-w-md">{{ ad.link }}</a>
            <div v-if="ad.imageUrl" class="text-xs text-zinc-600 mt-1">Image: {{ ad.imageUrl.substring(0, 40) }}...</div>
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
          No ad campaigns found. Create one above.
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Database, LogOut, Trash2, Power, Users, Activity, AlertTriangle, CheckCircle, TrendingUp, BarChart3, Globe } from 'lucide-vue-next'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, limit, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

const emit = defineEmits(['close'])

const activeTab = ref('metrics') // 'metrics' or 'ads'

// Metrics Data
const metrics = ref({
  totalUsers: 0,
  newUsersToday: 0,
  dau: 0,
  mau: 0,
  retentionRate: 0,
  completionRate: 0,
  completedSessions: 0,
  totalSessions: 0,
  crashes: 0,
  growthData: []
})
const loadingMetrics = ref(true)

// Logs Data (used for metrics calculation only, not displayed)
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

// Calculate Metrics from Logs
const calculateMetrics = (allLogs) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Helper to get date from timestamp
  const getDate = (timestamp) => {
    if (!timestamp) return null
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }
  
  // Filter logs by date
  const todayLogs = allLogs.filter(log => {
    const logDate = getDate(log.timestamp)
    return logDate && logDate.getTime() === today.getTime()
  })
  
  const last30DaysLogs = allLogs.filter(log => {
    const logDate = getDate(log.timestamp)
    return logDate && logDate >= thirtyDaysAgo
  })
  
  // Calculate unique users
  const allUserIds = new Set(allLogs.map(log => log.userId).filter(Boolean))
  const todayUserIds = new Set(todayLogs.map(log => log.userId).filter(Boolean))
  const last30DaysUserIds = new Set(last30DaysLogs.map(log => log.userId).filter(Boolean))
  
  // New users today (first time appearing today)
  const userFirstSeen = new Map()
  allLogs.forEach(log => {
    if (!log.userId) return
    const logDate = getDate(log.timestamp)
    if (!logDate) return
    
    if (!userFirstSeen.has(log.userId) || logDate < userFirstSeen.get(log.userId)) {
      userFirstSeen.set(log.userId, logDate)
    }
  })
  
  const newUsersToday = Array.from(todayUserIds).filter(userId => {
    const firstSeen = userFirstSeen.get(userId)
    return firstSeen && firstSeen.getTime() === today.getTime()
  }).length
  
  // Session completion (sessions that completed = have itemsChecked)
  const completedSessions = allLogs.filter(log => log.itemsChecked !== undefined && log.itemsChecked > 0).length
  const totalSessions = allLogs.length
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
  
  // Growth data (last 30 days)
  const growthMap = new Map()
  last30DaysLogs.forEach(log => {
    const logDate = getDate(log.timestamp)
    if (!logDate) return
    
    const dateKey = logDate.toISOString().split('T')[0]
    if (!growthMap.has(dateKey)) {
      growthMap.set(dateKey, new Set())
    }
    if (log.userId) {
      growthMap.get(dateKey).add(log.userId)
    }
  })
  
  // Build 30-day array
  const growthData = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split('T')[0]
    const newUsers = growthMap.get(dateKey) ? Array.from(growthMap.get(dateKey)).filter(userId => {
      const firstSeen = userFirstSeen.get(userId)
      return firstSeen && firstSeen.getTime() === date.getTime()
    }).length : 0
    growthData.push(newUsers)
  }
  
  const maxDailyGrowth = Math.max(...growthData, 1)
  
  // DAU/MAU Retention
  const dau = todayUserIds.size
  const mau = last30DaysUserIds.size
  const retentionRate = mau > 0 ? Math.round((dau / mau) * 100) : 0
  
  return {
    totalUsers: allUserIds.size,
    newUsersToday,
    dau,
    mau,
    retentionRate,
    completionRate,
    completedSessions,
    totalSessions,
    crashes: 0, // TODO: Track crashes separately
    growthData,
    maxDailyGrowth
  }
}

onMounted(() => {
  // 1. Fetch All Logs for Metrics (fetch more for accurate metrics)
  // Note: Firestore has a limit of fetching documents, but this should work for most cases
  // For very large datasets, consider pagination or Cloud Functions
  const allLogsQuery = query(
    collection(db, "shift_logs"),
    orderBy("timestamp", "desc"),
    limit(1000) // Fetch up to 1000 most recent logs for metrics
  )

  logsUnsubscribe = onSnapshot(allLogsQuery, (snapshot) => {
    const allLogs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Calculate metrics from all fetched logs
    metrics.value = calculateMetrics(allLogs)
    loadingMetrics.value = false
  }, (error) => {
    console.error("Logs Access Error:", error)
    loadingMetrics.value = false
  })

  // 2. Fetch Ads
  // Try with orderBy first, fallback to simple query if index missing
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
  }, (error) => {
    console.error("Ads Access Error (likely missing index):", error)
    // Try fallback query without orderBy
    const fallbackQuery = query(collection(db, "ads"))
    if (adsUnsubscribe) adsUnsubscribe() // Clean up previous subscription
    adsUnsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
      ads.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Sort by createdAt manually
      ads.value.sort((a, b) => {
        const aTime = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0
        const bTime = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0
        return bTime - aTime
      })
      loadingAds.value = false
    }, (fallbackError) => {
      console.error("Fallback query also failed:", fallbackError)
      loadingAds.value = false
    })
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
  if (!confirm("Are you sure you want to delete this campaign? This cannot be undone.")) return
  try {
    await deleteDoc(doc(db, "ads", id))
    alert("Campaign deleted successfully.")
  } catch (e) {
    console.error("Error deleting ad:", e)
    alert("Failed to delete campaign. Check console for details.")
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

const formatChartDate = (daysAgo) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - daysAgo))
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

const getEngagementClass = (dau) => {
  if (dau >= 100) return 'text-green-400'
  if (dau >= 50) return 'text-yellow-400'
  return 'text-zinc-500'
}

const getEngagementText = (dau) => {
  if (dau >= 100) return 'High engagement!'
  if (dau >= 50) return 'Good engagement'
  return 'Low engagement'
}

const getRetentionStatus = (rate) => {
  if (rate >= 50) return 'Excellent retention! Users are coming back regularly.'
  if (rate >= 30) return 'Good retention. Room for improvement.'
  if (rate >= 20) return 'Moderate retention. Consider improving user experience.'
  return 'Low retention. Investigate why users aren\'t returning.'
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

.modal-backdrop {
  @apply fixed inset-0 bg-black/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4;
}

.modal-content {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Metrics Card Styles */
.metric-card {
  @apply bg-zinc-900 border border-zinc-800 rounded-xl p-6;
}

.metric-header {
  @apply flex items-center gap-2 mb-3;
}

.metric-label {
  @apply text-xs font-bold text-zinc-500 uppercase tracking-wider;
}

.metric-value {
  @apply text-3xl font-bold text-white mb-1;
}

.metric-change {
  @apply text-sm font-medium;
}
</style>
