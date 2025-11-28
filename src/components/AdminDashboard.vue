<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <div>
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <Database :size="24" class="text-blue-500" />
          Car Park Control
        </h2>
        <p class="text-xs text-zinc-500 mt-1">System Logs & Diagnostics</p>
      </div>
      <button @click="$emit('close')" class="exit-btn">
        <LogOut :size="20" />
      </button>
    </div>

    <div class="table-container">
      <div v-if="loading" class="p-8 text-center text-zinc-500">
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Database, LogOut } from 'lucide-vue-next'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'

const emit = defineEmits(['close'])

const logs = ref([])
const loading = ref(true)
let unsubscribe = null

onMounted(() => {
  // Real-time listener for logs
  // "shift_logs" is the collection name we defined in firebase.js
  const q = query(
    collection(db, "shift_logs"),
    orderBy("timestamp", "desc"),
    limit(50) // Only get last 50 to save reads
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    logs.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    loading.value = false
  }, (error) => {
    console.error("Access Error:", error)
    loading.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

// Formatters
const formatTime = (timestamp) => {
  if (!timestamp) return '--:--'
  // Firestore timestamp to JS Date
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
  @apply flex justify-between items-center p-6 border-b border-zinc-900 bg-zinc-950;
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

