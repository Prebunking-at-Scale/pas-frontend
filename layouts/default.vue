<script setup>
import '~/assets/css/styles.css';

const route = useRoute();
const { $i18n } = useNuxtApp();
const { headerContent } = usePageHeader();

const defaultPageTitle = computed(() => {
  switch (route.path) {
    case '/':
    case '/dashboard':
      return $i18n.t('dashboard.title');
    case '/narratives':
      return $i18n.t('narratives.title');
    case '/claims':
      return $i18n.t('claims.title');
    case '/videos':
      return $i18n.t('videos.title');
    case '/alerts':
      return $i18n.t('alerts.title');
    case '/profile':
      return $i18n.t('profile.title');
    default:
      if (route.path.startsWith('/narratives/')) {
        return $i18n.t('narratives.title');
      }
      if (route.path.startsWith('/claims/')) {
        return $i18n.t('claims.title');
      }
      if (route.path.startsWith('/videos/')) {
        return $i18n.t('videos.title');
      }
      return 'Dashboard';
  }
});

// Use computed property for active route checking to ensure reactivity
const isActive = (path) => {
  if (path === '/dashboard') {
    return route.path === '/' || route.path === '/dashboard';
  }
  if (path === '/alerts' || path === '/profile') {
    return route.path === path;
  }
  return route.path.startsWith(path);
};
</script>

<template>

  <div class="p-4 max-w-[1536px] mx-auto">

    <header class="from-emerald-800 to-emerald-900 bg-gradient-to-r rounded-xl p-6 flex gap-8 divider-y items-center">
      <a href="/">
        <img 
          src="assets/images/prebunking-logo.png" 
          class="max-h-16"
          style="filter: brightness(0) invert(1);"
        />
      </a>
      <div class="border-l border-l-neutral-400">
        <span class="text-gray-100 text-xs font-semibold uppercase ml-8" id="pretitle">Prebunking At Scale</span>

        <!-- Custom header content if provided -->
        <div v-if="headerContent" class="ml-8 text-gray-50">
          <!-- Custom component -->
          <component v-if="headerContent.customComponent" :is="headerContent.customComponent" />

          <!-- Custom HTML -->
          <div v-else-if="headerContent.customHtml" v-html="headerContent.customHtml" class="my-4"></div>

          <!-- Simple title -->
          <h1 v-else-if="headerContent.title" class="my-4 text-gray-50 font-bold text-4xl">{{ headerContent.title }}</h1>
        </div>

        <!-- Default title -->
        <h1 v-else class="ml-8 my-4 text-gray-50 font-bold text-4xl">{{ defaultPageTitle }}</h1>
      </div>
    </header>

    <main class="grid grid-cols-12 gap-4 mt-6">

      <aside class="col-span-2">
        <nav class="space-y-2">
          <NuxtLink
            to="/dashboard"
            :class="['block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors', { 'bg-neutral-100': isActive('/dashboard') }]"
            :prefetch="false"
          >
            {{ $t('nav.overview') }}
          </NuxtLink>
          <NuxtLink
            to="/narratives"
            :class="['block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors', { 'bg-neutral-100': isActive('/narratives') }]"
            :prefetch="false"
          >
            {{ $t('nav.narratives') }}
          </NuxtLink>
          <NuxtLink
            to="/claims"
            :class="['block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors', { 'bg-neutral-100': isActive('/claims') }]"
            :prefetch="false"
          >
            {{ $t('nav.claims') }}
          </NuxtLink>
          <NuxtLink
            to="/videos"
            :class="['block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors', { 'bg-neutral-100': isActive('/videos') }]"
            :prefetch="false"
          >
            {{ $t('nav.videos') }}
          </NuxtLink>

          <div class="pt-4 mt-4 border-t border-neutral-200">
            <NuxtLink
              to="/alerts"
              :class="['block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors', { 'bg-neutral-100': isActive('/alerts') }]"
              :prefetch="false"
            >
              {{ $t('nav.alerts') }}
            </NuxtLink>
            <NuxtLink
              to="/profile"
              :class="['block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors', { 'bg-neutral-100': isActive('/profile') }]"
              :prefetch="false"
            >
              {{ $t('nav.profile') }}
            </NuxtLink>
          </div>

          <div class="pt-4 mt-4 border-t border-neutral-200">
            <span class="block px-4 py-2 text-neutral-400 cursor-not-allowed">{{ $t('nav.help') }}</span>
          </div>
        </nav>
      </aside>

      <article class="col-span-10">
        <slot />
      </article>

    </main>

  </div>

</template>

<style scoped>

</style>
