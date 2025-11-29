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
      <div class="flex gap-2">
        <!-- Share/Download PDF Button (Only visible on Logs tab) -->
        <button 
          v-if="activeTab === 'logs' && logs.length > 0"
          @click="shareOrDownloadPDF"
          class="p-2 text-zinc-500 hover:text-blue-400 hover:bg-zinc-900 rounded-lg transition-colors flex items-center gap-2"
          title="Share or Download Report"
        >
          <Download :size="20" />
          <span class="hidden sm:inline text-xs font-bold uppercase">Share PDF</span>
        </button>
        
        <button @click="$emit('close')" class="exit-btn">
          <LogOut :size="20" />
        </button>
      </div>
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

    <!-- Share Modal -->
    <div v-if="showShareModal" class="modal-backdrop" @click.self="showShareModal = false">
      <div class="modal-content bg-zinc-900 border border-zinc-800 p-6 max-w-sm w-full rounded-2xl">
        <h3 class="text-lg font-bold text-white mb-4">Share Report</h3>
        
        <div class="space-y-3">
          <button 
            @click="shareViaWhatsApp"
            class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <span>📱</span>
            Share via WhatsApp
          </button>
          
          <button 
            @click="shareViaNative"
            class="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <span>📤</span>
            Share via System
          </button>
          
          <button 
            @click="downloadPDFOnly"
            class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <Download :size="18" />
            Download PDF Only
          </button>
        </div>
        
        <button 
          @click="showShareModal = false" 
          class="w-full mt-4 py-2 text-zinc-500 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Database, LogOut, Trash2, Power, Download } from 'lucide-vue-next'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, limit, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const emit = defineEmits(['close'])

const activeTab = ref('logs') // 'logs' or 'ads'
const showShareModal = ref(false)

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

// --- PDF Export Logic ---
const generatePDF = () => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(18)
  doc.text('Digiget Shift Report', 14, 22)
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
  
  // Prepare data for table
  const tableData = logs.value.map(log => [
    formatDate(log.timestamp) + ' ' + formatTime(log.timestamp),
    log.userId ? log.userId.slice(0, 8) + '...' : 'Anon',
    `${log.itemsChecked || 0} Checked`,
    log.skippedItems && log.skippedItems.length > 0 ? log.skippedItems.join(', ') : 'None'
  ])

  // Generate Table
  autoTable(doc, {
    startY: 36,
    head: [['Time', 'User ID', 'Status', 'Skipped Items']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [24, 24, 27], textColor: 255 }, // Zinc 900
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  })
  
  return doc
}

const shareOrDownloadPDF = () => {
  showShareModal.value = true
}

const shareViaWhatsApp = async () => {
  const doc = generatePDF()
  const pdfBlob = doc.output('blob')
  const pdfFile = new File([pdfBlob], 'digiget-report.pdf', { type: 'application/pdf' })
  
  // Try native share API first (works with WhatsApp on mobile)
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        title: 'Digiget Shift Report',
        text: 'Digiget shift completion report',
        files: [pdfFile]
      })
      showShareModal.value = false
      return
    } catch (error) {
      if (error.name === 'AbortError') {
        showShareModal.value = false
        return
      }
    }
  }
  
  // Fallback: Download PDF and open WhatsApp Web
  doc.save('digiget-report.pdf')
  
  // Open WhatsApp Web with message (user can attach the downloaded PDF manually)
  const message = encodeURIComponent('Digiget Shift Report - Please check the downloaded PDF file.')
  const whatsappUrl = `https://web.whatsapp.com/send?text=${message}`
  
  setTimeout(() => {
    window.open(whatsappUrl, '_blank')
  }, 500)
  
  showShareModal.value = false
}

const shareViaNative = async () => {
  const doc = generatePDF()
  const pdfBlob = doc.output('blob')
  const pdfFile = new File([pdfBlob], 'digiget-report.pdf', { type: 'application/pdf' })
  
  if (navigator.share) {
    try {
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: 'Digiget Shift Report',
          text: 'Digiget shift completion report',
          files: [pdfFile]
        })
        showShareModal.value = false
        return
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error)
        alert('Sharing not available. Downloading PDF instead.')
      } else {
        showShareModal.value = false
        return
      }
    }
  }
  
  // Fallback to download
  doc.save('digiget-report.pdf')
  showShareModal.value = false
}

const downloadPDFOnly = () => {
  const doc = generatePDF()
  doc.save('digiget-report.pdf')
  showShareModal.value = false
}

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
</style>
