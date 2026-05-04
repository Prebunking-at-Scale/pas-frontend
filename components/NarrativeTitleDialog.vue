<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ $t('narratives.editTitle') }}
        </DialogTitle>
      </DialogHeader>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="title">{{ $t('narratives.newTitle') }}</Label>
          <Input
            id="title"
            v-model="formData.title"
            :placeholder="$t('narratives.titlePlaceholder')"
            :maxlength="255"
            required
          />
        </div>

        <div v-if="validationError" class="text-sm text-destructive">
          {{ validationError }}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="dialogOpen = false">
            {{ $t('common.cancel') }}
          </Button>
          <Button type="submit" :disabled="loading">
            {{ loading ? $t('common.saving') : $t('common.save') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Narrative } from '~/types/api'
import { apiService } from '~/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  narrative: Narrative | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [narrative: Narrative]
}>()

const { t } = useI18n()
const toast = useToast()

const dialogOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const formData = ref({
  title: ''
})

const loading = ref(false)
const validationError = ref<string | null>(null)

const handleSubmit = async () => {
  if (!props.narrative) {
    validationError.value = t('common.error_occurred')
    return
  }

  // Validate that title is not empty
  if (!formData.value.title.trim()) {
    validationError.value = t('narratives.titleRequired')
    return
  }

  loading.value = true
  validationError.value = null

  try {
    const updatedNarrative = await apiService.updateNarrative(props.narrative.id, {
      title: formData.value.title.trim()
    })
    
    emit('save', updatedNarrative)
    toast.add({
      title: t('common.success'),
      description: t('narratives.updateSuccess')
    })
    dialogOpen.value = false
  } catch (error: any) {
    validationError.value = error.message || t('common.error_occurred')
    toast.add({
      title: t('common.error'),
      description: error.message || t('common.error_occurred'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

watch(() => props.open, (newValue) => {
  if (newValue && props.narrative) {
    formData.value = {
      title: props.narrative.title || ''
    }
    validationError.value = null
  }
})
</script>