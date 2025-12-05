<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="text-xl font-bold text-white">Manage Cards</h3>
        <button @click="$emit('close')" class="text-zinc-500 hover:text-white">
          <X :size="24" />
        </button>
      </div>

      <div class="modal-body">
        <p class="text-sm text-zinc-400 mb-4">
          All cards are editable, including default ones. Edit titles, icons, or delete cards. Changes are saved automatically.
        </p>

        <div class="cards-list">
          <div 
            v-for="card in allCards" 
            :key="card.id"
            class="card-item"
          >
            <div class="card-info">
              <div class="card-icon-wrapper">
                <component :is="card.icon" :size="24" />
              </div>
              <span class="card-title-text">{{ card.title }}</span>
            </div>
            
            <div class="card-actions">
              <button 
                @click="$emit('edit', card)"
                class="action-btn edit-btn"
                title="Edit Card"
              >
                <Pencil :size="18" />
              </button>
              <button 
                @click="handleDelete(card)"
                class="action-btn delete-btn"
                title="Delete Card"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </div>

          <div v-if="allCards.length === 0" class="empty-state">
            <p class="text-zinc-500 text-sm">No cards available. Add your first card below.</p>
          </div>
        </div>

        <div class="add-card-section">
          <button 
            @click="$emit('add-new')"
            class="add-card-btn"
          >
            <Plus :size="20" />
            <span>Add New Card</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { X, Pencil, Trash2, Plus } from 'lucide-vue-next'

const props = defineProps({
  cards: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'edit', 'delete', 'add-new'])

const allCards = computed(() => props.cards || [])

const handleDelete = (card) => {
  if (confirm(`Delete "${card.title}"? This cannot be undone.`)) {
    emit('delete', card)
  }
}
</script>

<style scoped>
.modal-backdrop {
  @apply fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  @apply bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh];
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  @apply flex justify-between items-center p-5 border-b border-zinc-800 shrink-0;
}

.modal-body {
  @apply p-5 overflow-y-auto;
}

.cards-list {
  @apply space-y-2 mb-4;
}

.card-item {
  @apply flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors;
}

.card-info {
  @apply flex items-center gap-3 flex-1;
}

.card-icon-wrapper {
  @apply w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400;
}

.card-title-text {
  @apply text-white font-medium;
}

.card-actions {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply w-9 h-9 rounded-lg flex items-center justify-center transition-colors;
}

.edit-btn {
  @apply bg-zinc-800 text-zinc-400 hover:bg-blue-500/20 hover:text-blue-400;
}

.delete-btn {
  @apply bg-zinc-800 text-zinc-400 hover:bg-red-500/20 hover:text-red-400;
}

.empty-state {
  @apply py-8 text-center;
}

.add-card-section {
  @apply mt-4 pt-4 border-t border-zinc-800;
}

.add-card-btn {
  @apply w-full py-3 px-4 rounded-xl bg-zinc-800 text-zinc-300 font-medium flex items-center justify-center gap-2 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
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

