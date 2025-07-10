<script setup>
import '~/assets/css/styles.css';

const route = useRoute();
const { $i18n } = useNuxtApp();
const { headerContent } = usePageHeader();

const defaultPageTitle = computed(() => {
  switch (route.path) {
    case '/dashboard':
      return $i18n.t('dashboard.title');
    case '/narratives':
      return $i18n.t('narratives.title');
    case '/alerts':
      return $i18n.t('alerts.title');
    case '/profile':
      return $i18n.t('profile.title');
    default:
      if (route.path.startsWith('/narratives/')) {
        return $i18n.t('narratives.title');
      }
      return 'Dashboard';
  }
});
</script>

<template>

  <div class="p-4 max-w-[1536px] mx-auto">

    <header class="bg-neutral-200 rounded-xl p-6 flex gap-8 divider-y items-center">
      <a href="/"><img src="assets/images/prebunking-logo.png" class="max-h-16"/></a>
      <div class="border-l border-l-neutral-400">
        <span class="text-neutral-500 text-xs font-bold ml-8" id="pretitle">Prebunking At Scale</span>

        <!-- Custom header content if provided -->
        <div v-if="headerContent" class="ml-8">
          <!-- Custom component -->
          <component v-if="headerContent.customComponent" :is="headerContent.customComponent" />

          <!-- Custom HTML -->
          <div v-else-if="headerContent.customHtml" v-html="headerContent.customHtml" class="my-4"></div>

          <!-- Simple title -->
          <h1 v-else-if="headerContent.title" class="my-4 font-bold text-4xl">{{ headerContent.title }}</h1>
        </div>

        <!-- Default title -->
        <h1 v-else class="ml-8 my-4 font-bold text-4xl">{{ defaultPageTitle }}</h1>
      </div>
    </header>

    <main class="grid grid-cols-12 gap-4 mt-6">

      <aside class="col-span-2">
        <nav class="space-y-2">
          <NuxtLink
            to="/dashboard"
            class="block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            :class="$route.path === '/dashboard' ? 'bg-neutral-100' : ''"
          >
            {{ $t('nav.overview') }}
          </NuxtLink>
          <NuxtLink
            to="/narratives"
            class="block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            :class="$route.path.startsWith('/narratives') ? 'bg-neutral-100' : ''"
          >
            {{ $t('nav.narratives') }}
          </NuxtLink>
          <NuxtLink
            to="/alerts"
            class="block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            :class="$route.path === '/alerts' ? 'bg-neutral-100' : ''"
          >
            {{ $t('nav.alerts') }}
          </NuxtLink>
          <NuxtLink
            to="/profile"
            class="block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            :class="$route.path === '/profile' ? 'bg-neutral-100' : ''"
          >
            {{ $t('nav.profile') }}
          </NuxtLink>

          <div class="pt-4 mt-4 border-t border-neutral-200">
            <span class="block px-4 py-2 text-neutral-400 cursor-not-allowed">{{ $t('nav.messages') }}</span>
            <span class="block px-4 py-2 text-neutral-400 cursor-not-allowed">{{ $t('nav.authentication') }}</span>
          </div>

          <div class="pt-4 mt-4 border-t border-neutral-200">
            <span class="block px-4 py-2 text-neutral-400 cursor-not-allowed">{{ $t('nav.docs') }}</span>
            <span class="block px-4 py-2 text-neutral-400 cursor-not-allowed">{{ $t('nav.components') }}</span>
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
