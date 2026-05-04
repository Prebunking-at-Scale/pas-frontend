<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ $t('common.confirm_unlink_title') }}
        </DialogTitle>
        <DialogDescription>
          {{ $t('common.confirm_unlink_description') }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" @click="handleCancel">
          {{ $t('common.cancel') }}
        </Button>
        <Button type="button" variant="destructive" @click="handleConfirm" :disabled="loading">
          {{ loading ? $t('common.unlinking') : $t('common.unlink') }}
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
  get: () => dialogsStore.isUnlinkDialogOpen,
  set: (value) => {
    if (!value) {
      dialogsStore.closeUnlinkDialog()
    }
  }
})

const handleCancel = () => {
  dialogsStore.closeUnlinkDialog()
  loading.value = false
}

const handleConfirm = async () => {
  loading.value = true
  await dialogsStore.confirmUnlink()
  loading.value = false
}
</script>