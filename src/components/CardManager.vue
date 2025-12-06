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
            :data-index="index"
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
        animation: 150,
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
        forceFallback: true, // Force fallback for better mobile experience
        touchStartThreshold: 3, // Lower threshold for easier touch activation
        fallbackTolerance: 0,
        onStart: (evt) => {
          // Haptic feedback on mobile
          if ('vibrate' in navigator) {
            try {
              navigator.vibrate(10)
            } catch (e) {
              // Silently fail
            }
          }
        },
        onMove: (evt) => {
          // Add visual feedback during move - show drop indicator
          const related = evt.related
          const dragged = evt.dragged
          
          // Remove previous indicators
          const allItems = cardsListRef.value.querySelectorAll('.card-item')
          allItems.forEach(item => {
            item.classList.remove('sortable-move-target', 'sortable-move-target-top', 'sortable-move-target-bottom')
          })
          
          if (related && dragged && related !== dragged) {
            const relatedIndex = parseInt(related.dataset.index) || 0
            const draggedIndex = parseInt(dragged.dataset.index) || 0
            
            // Determine if we should show indicator above or below
            if (draggedIndex < relatedIndex) {
              related.classList.add('sortable-move-target-bottom')
            } else if (draggedIndex > relatedIndex) {
              related.classList.add('sortable-move-target-top')
            }
          }
        },
        onEnd: (evt) => {
          // Remove move target class from all items
          const items = cardsListRef.value.querySelectorAll('.card-item')
          items.forEach(item => item.classList.remove('sortable-move-target'))
          
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
  min-height: 100px;
}

.card-item {
  @apply flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700;
  cursor: move;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  touch-action: none; /* Prevent scrolling while dragging on mobile */
  -webkit-touch-callout: none; /* Disable long press menu on iOS */
  user-select: none;
}

/* SortableJS classes */
.sortable-ghost {
  opacity: 0.3;
  background-color: rgba(59, 130, 246, 0.15);
  border-color: rgb(59 130 246);
  border-width: 2px;
  border-style: dashed;
}

.sortable-chosen {
  cursor: grabbing;
  opacity: 1;
  transform: scale(1.08) rotate(2deg);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(59, 130, 246, 0.5);
  z-index: 1000 !important;
  background-color: rgb(24 24 27) !important;
  border-color: rgb(59 130 246) !important;
}

.sortable-drag {
  opacity: 1 !important;
  transform: scale(1.08) rotate(2deg) !important;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
  z-index: 1000 !important;
  background-color: rgb(24 24 27) !important;
  border-color: rgb(59 130 246) !important;
  pointer-events: none !important;
}

/* Ensure dragged element is visible on mobile */
@media (max-width: 768px) {
  .sortable-drag {
    transform: scale(1.1) rotate(3deg) !important;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.6), 0 0 0 3px rgba(59, 130, 246, 0.7) !important;
  }
  
  .sortable-chosen {
    transform: scale(1.1) rotate(3deg) !important;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.6), 0 0 0 3px rgba(59, 130, 246, 0.7) !important;
  }
}

.sortable-move-target-top {
  position: relative;
  margin-top: 8px !important;
}

.sortable-move-target-top::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 0;
  right: 0;
  height: 3px;
  background: rgb(59 130 246);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
  animation: pulse-line 1s ease-in-out infinite;
  z-index: 10;
}

.sortable-move-target-bottom {
  position: relative;
  margin-bottom: 8px !important;
}

.sortable-move-target-bottom::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  right: 0;
  height: 3px;
  background: rgb(59 130 246);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
  animation: pulse-line 1s ease-in-out infinite;
  z-index: 10;
}

@keyframes pulse-line {
  0%, 100% {
    opacity: 0.6;
    transform: scaleX(0.95);
  }
  50% {
    opacity: 1;
    transform: scaleX(1);
  }
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

