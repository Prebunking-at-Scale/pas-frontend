<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ $t('narratives.merge.title') }}
        </DialogTitle>
        <DialogDescription>
          {{ $t('narratives.merge.description') }}
        </DialogDescription>
      </DialogHeader>
      <div class="py-4">
        <NarrativeAutocomplete
          v-model="selectedNarrative"
          :narratives="availableNarratives"
          :loading="searchLoading"
          :label="$t('narratives.merge.selectTarget')"
          :placeholder="$t('narratives.merge.searchPlaceholder')"
          @search="handleSearchNarratives"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" @click="handleCancel">
          {{ $t('common.cancel') }}
        </Button>
        <Button type="button" variant="destructive" @click="handleConfirm" :disabled="loading || !selectedNarrative">
          {{ loading ? $t('narratives.merge.merging') : $t('narratives.merge.mergeAndDelete') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import NarrativeAutocomplete from '@/components/NarrativeAutocomplete.vue'
import { useNarrativeDialogsStore } from '~/stores/narrativeDialogs'
import { useRoute } from 'vue-router'
import { apiService } from '~/services/api'
import type { Narrative } from '~/types/api'

const toast = useToast()
const { t } = useI18n()
const dialogsStore = useNarrativeDialogsStore()
const route = useRoute()
const loading = ref(false)
const searchLoading = ref(false)
const selectedNarrative = ref<Narrative | null>(null)
const availableNarratives = ref<Narrative[]>([])

const dialogOpen = computed({
  get: () => dialogsStore.isMergeDialogOpen,
  set: (value) => {
    if (!value) {
      dialogsStore.closeMergeDialog()
      // Reset state when closing
      selectedNarrative.value = null
      availableNarratives.value = []
    }
  }
})

// Function to search narratives from API
const handleSearchNarratives = async (query: string) => {
  searchLoading.value = true
  
  try {
    // Get current narrative ID from route to exclude it from results
    const currentNarrativeId = route.params.id

    const result = await apiService.getNarratives({
      text: query,
    })

    const narratives = result.data.filter(n => n.id !== currentNarrativeId)    
    availableNarratives.value = narratives
  } catch (error) {
    console.error('Error searching narratives:', error)
    availableNarratives.value = []
  } finally {
    searchLoading.value = false
  }
}

const handleCancel = () => {
  dialogsStore.closeMergeDialog()
  loading.value = false
}

const handleConfirm = async () => {
  if (!selectedNarrative.value) return

  loading.value = true
  await dialogsStore.confirmMerge(selectedNarrative.value)  
  loading.value = false
}

// Reset selected ID when dialog opens
watch(() => dialogsStore.isMergeDialogOpen, (isOpen) => {
  if (isOpen) {
    selectedNarrative.value = null
    availableNarratives.value = []
  }
})

</script>