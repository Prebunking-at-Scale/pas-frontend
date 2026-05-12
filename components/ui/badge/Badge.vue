<template>
  <div :class="cn(badgeVariants({ variant }), textSize)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-white hover:bg-destructive/80',
        orange: 
          'border-transparent bg-orange-500 text-white hover:bg-orange-600',
        warning:
          'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
        purple:
          'border-transparent bg-purple-500 text-white hover:bg-purple-600',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'orange' | 'warning' | 'purple'
  textSize?: string
}

withDefaults(defineProps<BadgeProps>(), {
  variant: 'default',
  textSize: 'text-xs',
})
</script>