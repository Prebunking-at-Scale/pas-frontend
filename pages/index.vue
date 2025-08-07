<template>
  <div>
    <!-- Redirect to login or dashboard -->
  </div>
</template>

<script setup lang="ts">
// Immediate redirect logic in middleware
definePageMeta({
  middleware: defineNuxtRouteMiddleware(() => {
    const token = useCookie('auth-token').value;
    if (token) {
      return navigateTo('/dashboard');
    } else {
      return navigateTo('/login');
    }
  })
});
</script>