<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ $t('common.confirm_delete_title') }}
        </DialogTitle>
        <DialogDescription>
          {{ $t('common.confirm_delete_description') }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" @click="handleCancel">
          {{ $t('common.cancel') }}
        </Button>
        <Button type="button" variant="destructive" @click="handleConfirm" :disabled="loading">
          {{ loading ? $t('common.deleting') : $t('common.delete') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useNarrativeDialogsStore } from '~/stores/narrativeDialogs'

const dialogsStore = useNarrativeDialogsStore()
const loading = ref(false)

const dialogOpen = computed({
  get: () => dialogsStore.isDeleteDialogOpen,
  set: (value) => {
    if (!value) {
      dialogsStore.closeDeleteDialog()
    }
  }
})

const handleCancel = () => {
  dialogsStore.closeDeleteDialog()
  loading.value = false
}

const handleConfirm = async () => {
  loading.value = true
  await dialogsStore.confirmDelete()
  loading.value = false
}
</script>