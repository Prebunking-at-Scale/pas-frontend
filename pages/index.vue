<template>
  <div>
    <!-- Redirect to login or dashboard -->
  </div>
</template>

<script setup lang="ts">
// Immediate redirect logic in middleware
definePageMeta({
  middleware: defineNuxtRouteMiddleware(() => {
    if (process.client) {
      const token = localStorage.getItem('auth-token');
      if (token) {
        return navigateTo('/dashboard');
      } else {
        return navigateTo('/login');
      }
    }
  })
});
</script>