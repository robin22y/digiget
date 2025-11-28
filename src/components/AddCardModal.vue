<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="text-xl font-bold text-white">Add Custom Card</h3>
        <button @click="$emit('close')" class="text-zinc-500 hover:text-white">
          <X :size="24" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Title Input -->
        <div class="form-group">
          <label class="label">Card Title</label>
          <input 
            v-model="title" 
            type="text" 
            placeholder="e.g. Check Fluids"
            class="input-field"
            maxlength="25"
            ref="inputRef"
          />
          <p class="text-xs text-zinc-500 mt-2">
            This card will be saved for your future shifts.
          </p>
        </div>

        <!-- Quick Add Chips -->
        <div class="quick-tags">
          <button 
            v-for="tag in quickTags" 
            :key="tag"
            @click="title = tag"
            class="tag-chip"
            :class="{ 'active': title === tag }"
          >
            {{ tag }}
          </button>
        </div>

        <!-- Icon Selection -->
        <div class="form-group mt-6">
          <label class="label">Select Icon</label>
          <div class="icon-grid">
            <button 
              v-for="iconName in availableIcons" 
              :key="iconName"
              @click="selectedIcon = iconName"
              class="icon-option"
              :class="{ 'selected': selectedIcon === iconName }"
            >
              <component :is="iconMap[iconName]" :size="24" />
            </button>
          </div>
        </div>

        <!-- Color Selection -->
        <div class="form-group mt-6">
          <label class="label">Card Color</label>
          <div class="color-grid">
            <button 
              v-for="color in availableColors" 
              :key="color.value"
              @click="selectedColor = color.value"
              class="color-option"
              :class="{ 'selected': selectedColor === color.value }"
              :style="{ backgroundColor: color.value }"
              :aria-label="color.name"
            >
              <Check v-if="selectedColor === color.value" :size="16" class="text-white drop-shadow-md" />
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-cancel">Cancel</button>
        <button 
          @click="handleAdd" 
          class="btn-confirm"
          :disabled="!title.trim()"
        >
          Add Card
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { X, Clipboard, AlertCircle, Syringe, UserPlus, Droplets, Thermometer, Check } from 'lucide-vue-next'

const emit = defineEmits(['close', 'add'])

const title = ref('')
const selectedIcon = ref('Clipboard')
// Default color (zinc-800 equivalent or transparent if we want standard look)
const selectedColor = ref('#27272a') 
const inputRef = ref(null)

// The specific placeholders you requested
const quickTags = [
  'Catheter Care',
  'CVL Care Plan',
  'Admission',
  'Fluid Balance',
  'Glucometer Check'
]

const iconMap = {
  Clipboard, AlertCircle, Syringe, UserPlus, Droplets, Thermometer
}

const availableIcons = Object.keys(iconMap)

// Color options suitable for dark mode (slightly muted but distinct)
const availableColors = [
  { name: 'Zinc', value: '#27272a' },      // Default Dark Grey
  { name: 'Blue', value: '#1e3a8a' },      // Dark Blue
  { name: 'Green', value: '#14532d' },     // Dark Green
  { name: 'Red', value: '#7f1d1d' },       // Dark Red
  { name: 'Amber', value: '#78350f' },     // Dark Amber/Orange
  { name: 'Purple', value: '#581c87' },    // Dark Purple
]

const handleAdd = () => {
  if (!title.value.trim()) return
  
  emit('add', {
    title: title.value.trim(),
    iconName: selectedIcon.value,
    color: selectedColor.value
  })
}

onMounted(() => {
  // Focus input on open
  if (inputRef.value) inputRef.value.focus()
})
</script>

<style scoped>
.modal-backdrop {
  @apply fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  @apply bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh];
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  @apply flex justify-between items-center p-5 border-b border-zinc-800 shrink-0;
}

.modal-body {
  @apply p-5 overflow-y-auto;
}

.label {
  @apply block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2;
}

.input-field {
  @apply w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors;
}

/* Quick Tags */
.quick-tags {
  @apply flex flex-wrap gap-2 mt-3;
}

.tag-chip {
  @apply text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 transition-all hover:bg-zinc-700;
}

.tag-chip.active {
  @apply bg-blue-500/20 text-blue-400 border-blue-500/50;
}

/* Icon Grid */
.icon-grid {
  @apply grid grid-cols-6 gap-2;
}

.icon-option {
  @apply w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 border border-transparent transition-all;
}

.icon-option:hover {
  @apply bg-zinc-700;
}

.icon-option.selected {
  @apply bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-110;
}

/* Color Grid */
.color-grid {
  @apply flex flex-wrap gap-3;
}

.color-option {
  @apply w-10 h-10 rounded-full border-2 border-transparent transition-transform hover:scale-110 flex items-center justify-center;
}

.color-option.selected {
  @apply border-white scale-110 shadow-lg;
}

.modal-footer {
  @apply p-5 border-t border-zinc-800 flex gap-3 shrink-0 mt-auto;
}

.btn-cancel {
  @apply flex-1 py-3 rounded-xl text-zinc-400 font-medium hover:bg-zinc-800 transition-colors;
}

.btn-confirm {
  @apply flex-1 py-3 rounded-xl bg-white text-zinc-950 font-bold shadow-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all;
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
