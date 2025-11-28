<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="text-xl font-bold text-white capitalize">{{ title }}</h3>
        <button @click="$emit('close')" class="text-zinc-500 hover:text-white">
          <X :size="24" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Privacy Policy -->
        <div v-if="page === 'privacy'" class="prose prose-invert prose-sm">
          <h4>Privacy Policy</h4>
          <p>Last updated: {{ new Date().toLocaleDateString() }}</p>
          <p>Digiget ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your information is handled when you use our web application.</p>
          
          <h5>1. Information We Collect</h5>
          <p><strong>Usage Data:</strong> We collect anonymous usage statistics (e.g., completion of checklists) to improve the app. This data is not linked to your personal identity.</p>
          <p><strong>Local Storage:</strong> We use your device's local storage to save your custom checklist items and preferences. This data remains on your device and is not sent to our servers unless you sync anonymously.</p>

          <h5>2. No Personal Data</h5>
          <p>We do not require you to create an account with an email address or phone number. We do not collect names, addresses, or other personally identifiable information.</p>

          <h5>3. Data Security</h5>
          <p>While no service is completely secure, we use industry-standard encryption (HTTPS) and secure database practices (Firestore) to protect the limited data we process.</p>
        </div>

        <!-- Terms of Service -->
        <div v-else-if="page === 'terms'" class="prose prose-invert prose-sm">
          <h4>Terms of Service</h4>
          <p>By using Digiget, you agree to these terms.</p>
          
          <h5>1. Purpose</h5>
          <p>Digiget is a personal aid for memory and organization. It is <strong>not</strong> an official NHS medical device or a replacement for formal hospital protocols. You remain solely responsible for your professional duties and patient safety checks.</p>

          <h5>2. Disclaimer</h5>
          <p>The app is provided "as is" without warranties of any kind. We are not liable for any errors, omissions, or incidents resulting from the use of this app.</p>

          <h5>3. Usage</h5>
          <p>You agree to use this app only for lawful purposes and in accordance with your employer's policies regarding personal device usage.</p>
        </div>

        <!-- Cookie Policy -->
        <div v-else-if="page === 'cookie'" class="prose prose-invert prose-sm">
          <h4>Cookie Policy</h4>
          <p>Digiget uses essential "local storage" and "session storage" technologies to function.</p>
          <ul class="list-disc pl-4">
            <li><strong>Session Storage:</strong> Remembers if you have seen the welcome screen during your current visit.</li>
            <li><strong>Local Storage:</strong> Remembers your custom card preferences so you don't have to re-enter them every shift.</li>
          </ul>
          <p>We do not use third-party tracking cookies for advertising.</p>
        </div>

        <!-- Site Map -->
        <div v-else-if="page === 'sitemap'" class="prose prose-invert prose-sm">
          <h4>Site Map</h4>
          <ul class="space-y-2">
            <li><button @click="$emit('close')" class="text-blue-400 hover:underline">Home (Welcome Screen)</button></li>
            <li><span class="text-zinc-500">Checklist (Main App)</span></li>
            <li><span class="text-zinc-500">Add Custom Card (Modal)</span></li>
            <!-- Admin Panel Hidden from Public Site Map -->
          </ul>
        </div>

        <!-- FAQ -->
        <div v-else-if="page === 'faq'" class="prose prose-invert prose-sm">
          <h4>Frequently Asked Questions</h4>
          
          <div class="space-y-4">
            <div>
              <h5 class="font-bold text-white">Is this an official NHS app?</h5>
              <p>No. Digiget is an independent tool built to help nurses organize their end-of-shift routine. It is not affiliated with the NHS.</p>
            </div>
            
            <div>
              <h5 class="font-bold text-white">Does it work without internet?</h5>
              <p>Yes! Digiget is a Progressive Web App (PWA). Once loaded, it works completely offline.</p>
            </div>

            <div>
              <h5 class="font-bold text-white">Is my data private?</h5>
              <p>Yes. Your custom checklist items are stored on your own phone. We only see anonymous statistics about how many checklists are completed.</p>
            </div>

            <div>
              <h5 class="font-bold text-white">How do I add my own tasks?</h5>
              <p>Tap the "+" icon in the top right corner of the checklist screen.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  page: {
    type: String,
    required: true
  }
})

defineEmits(['close'])

const title = computed(() => {
  switch (props.page) {
    case 'privacy': return 'Privacy Policy'
    case 'terms': return 'Terms of Service'
    case 'cookie': return 'Cookie Policy'
    case 'sitemap': return 'Site Map'
    case 'faq': return 'FAQ'
    default: return 'Info'
  }
})
</script>

<style scoped>
.modal-backdrop {
  @apply fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  @apply bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh];
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  @apply flex justify-between items-center p-5 border-b border-zinc-800 shrink-0 bg-zinc-900/95 backdrop-blur sticky top-0;
}

.modal-body {
  @apply p-6 overflow-y-auto text-zinc-300;
}

/* Typography styles for content */
.prose h4 {
  @apply text-lg font-bold text-white mb-4;
}

.prose h5 {
  @apply text-sm font-bold text-zinc-200 mt-4 mb-2;
}

.prose p {
  @apply mb-3 text-sm leading-relaxed text-zinc-400;
}

.prose ul {
  @apply list-disc pl-5 mb-4 text-sm text-zinc-400;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px) scale(0.95); }
  to { transform: translateY(0) scale(1); }
}
</style>

