<script setup lang="ts">
import type { ButtonHTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { type ButtonVariants, buttonVariants } from '.'

interface Props {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: ButtonHTMLAttributes['class']
  type?: ButtonHTMLAttributes['type']
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
})
</script>

<template>
  <button
    data-slot="button"
    :type="type"
    :disabled="disabled"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </button>
</template>
