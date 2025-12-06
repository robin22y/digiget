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
          Drag cards to reorder them. Edit titles, icons, or delete cards. Changes are saved automatically.
        </p>

        <div class="cards-list" ref="cardsListRef">
          <div 
            v-for="(card, index) in sortedCards" 
            :key="card.id"
            class="card-item"
            :data-id="card.id"
          >
            <div class="card-info">
              <div class="drag-handle">
                <GripVertical :size="18" />
              </div>
              <div class="card-icon-wrapper">
                <component :is="card.icon" :size="24" />
              </div>
              <span class="card-title-text">{{ card.title }}</span>
            </div>
            
            <div class="card-actions" @mousedown.stop @click.stop>
              <button 
                @click.stop="$emit('edit', card)"
                class="action-btn edit-btn"
                title="Edit Card"
              >
                <Pencil :size="18" />
              </button>
              <button 
                @click.stop="handleDelete(card)"
                class="action-btn delete-btn"
                title="Delete Card"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </div>

          <div v-if="sortedCards.length === 0" class="empty-state">
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
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { X, Pencil, Trash2, Plus, GripVertical } from 'lucide-vue-next'
import Sortable from 'sortablejs'

const props = defineProps({
  cards: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'edit', 'delete', 'add-new', 'reorder'])

const cardsListRef = ref(null)
let sortableInstance = null

// Sort cards by position (if available), then by title as fallback
const sortedCards = computed(() => {
  const cards = [...(props.cards || [])]
  return cards.sort((a, b) => {
    // If both have position, sort by position
    if (a.position !== undefined && b.position !== undefined) {
      return a.position - b.position
    }
    // If only one has position, prioritize it
    if (a.position !== undefined) return -1
    if (b.position !== undefined) return 1
    // Fallback to title sorting
    return a.title.localeCompare(b.title)
  })
})

const handleDelete = (card) => {
  if (confirm(`Delete "${card.title}"? This cannot be undone.`)) {
    emit('delete', card)
  }
}

onMounted(() => {
  nextTick(() => {
    if (cardsListRef.value) {
      sortableInstance = Sortable.create(cardsListRef.value, {
        animation: 200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        handle: '.drag-handle, .card-info',
        filter: '.card-actions, .action-btn',
        preventOnFilter: true,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        fallbackOnBody: true,
        swapThreshold: 0.65,
        invertSwap: false,
        forceFallback: false,
        touchStartThreshold: 5,
        onEnd: (evt) => {
          const { oldIndex, newIndex } = evt
          if (oldIndex !== newIndex && oldIndex !== undefined && newIndex !== undefined) {
            const draggedCard = sortedCards.value[oldIndex]
            emit('reorder', {
              card: draggedCard,
              newIndex: newIndex,
              oldIndex: oldIndex
            })
          }
        }
      })
    }
  })
})

onUnmounted(() => {
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }
})
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
  position: relative;
}

.card-item {
  @apply flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700;
  cursor: move;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* SortableJS classes */
.sortable-ghost {
  opacity: 0.4;
  background-color: rgba(59, 130, 246, 0.1);
  border-color: rgb(59 130 246);
}

.sortable-chosen {
  cursor: grabbing;
  opacity: 0.8;
  transform: scale(1.02);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.sortable-drag {
  opacity: 0.5;
}

.card-info {
  @apply flex items-center gap-3 flex-1;
}

.drag-handle {
  @apply text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing;
}

.card-icon-wrapper {
  @apply w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400;
}

.card-title-text {
  @apply text-white font-medium;
}

.card-actions {
  @apply flex items-center gap-2;
  pointer-events: auto;
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

