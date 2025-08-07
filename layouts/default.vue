<script setup lang="ts">
import '~/assets/css/styles.css';
import {faHouse, faVideo, faCircleNodes, faComment, faSignOutAlt, faUser, faBriefcase} from '@fortawesome/free-solid-svg-icons'
import Footer from '~/components/Footer.vue';
import { authService } from '~/services/auth';
import type { IdentityResponse } from '~/types/api';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { headerContent } = usePageHeader();

// Admin status
const identity = ref<IdentityResponse | null>(null);
const isOrganizationAdmin = computed(() => identity.value?.is_organisation_admin || false);

// Fetch identity on mount
onMounted(async () => {
  try {
    identity.value = await authService.getIdentity();
  } catch (error) {
    console.error('Failed to load identity:', error);
  }
});

const defaultPageTitle = computed(() => {
  switch (route.path) {
    case '/':
    case '/dashboard':
      return t('dashboard.title');
    case '/narratives':
      return t('narratives.title');
    case '/claims':
      return t('claims.title');
    case '/videos':
      return t('videos.title');
    case '/alerts':
      return t('alerts.title');
    case '/profile':
      return t('profile.title');
    case '/admin':
      return `${t('admin.manageOrganization')}: ${identity.value?.organisation?.display_name || ''}`;
    default:
      if (route.path.startsWith('/narratives/')) {
        return t('narratives.title');
      }
      if (route.path.startsWith('/claims/')) {
        return t('claims.title');
      }
      if (route.path.startsWith('/videos/')) {
        return t('videos.title');
      }
      return 'Dashboard';
  }
});

// Use computed property for active route checking to ensure reactivity
const isActive = (path) => {
  if (path === '/dashboard') {
    return route.path === '/' || route.path === '/dashboard';
  }
  if (path === '/alerts' || path === '/profile' || path === '/admin') {
    return route.path === path;
  }
  return route.path.startsWith(path);
};

// Logout handler
const handleLogout = () => {
  authService.logout();
  router.push('/login');
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
        <span class="text-gray-100 text-xs font-light uppercase ml-8" id="pretitle">Prebunking At Scale</span>

        <!-- Custom header content if provided -->
        <div v-if="headerContent" class="ml-8 text-gray-50">
          <!-- Custom component -->
          <component v-if="headerContent.customComponent" :is="headerContent.customComponent" />

          <!-- Custom HTML -->
          <div v-else-if="headerContent.customHtml" v-html="headerContent.customHtml" class=""></div>

          <!-- Simple title -->
          <h1 v-else-if="headerContent.title" class="text-gray-50 font-bold text-4xl">{{ headerContent.title }}</h1>
        </div>

        <!-- Default title -->
        <h1 v-else class="ml-8 text-gray-50 font-bold text-4xl">{{ defaultPageTitle }}</h1>
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
          <font-awesome :icon="faHouse" class="mr-2"/>{{ $t('nav.overview') }}
          </NuxtLink>
          <NuxtLink
            to="/narratives"
            :class="['block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors', { 'bg-neutral-100': isActive('/narratives') }]"
            :prefetch="false"
          >
          <font-awesome :icon="faCircleNodes" class="mr-2"/>{{ $t('nav.narratives') }}
          </NuxtLink>
          <NuxtLink
            to="/claims"
            :class="['block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors', { 'bg-neutral-100': isActive('/claims') }]"
            :prefetch="false"
          >
            <font-awesome :icon="faComment" class="mr-2"/>{{ $t('nav.claims') }}
          </NuxtLink>
          <NuxtLink
            to="/videos"
            :class="['block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors', { 'bg-neutral-100': isActive('/videos') }]"
            :prefetch="false"
          >
            <font-awesome :icon="faVideo" class="mr-2"/>{{ $t('nav.videos') }}
          </NuxtLink>

          <div class="pt-4 mt-4 border-t border-neutral-200">
            <!-- Alerts menu option hidden for now -->
            <!-- <NuxtLink
              to="/alerts"
              :class="['block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors', { 'bg-neutral-100': isActive('/alerts') }]"
              :prefetch="false"
            >
              {{ $t('nav.alerts') }}
            </NuxtLink> -->
            <NuxtLink
              to="/profile"
              :class="['block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors', { 'bg-neutral-100': isActive('/profile') }]"
              :prefetch="false"
            >
              <font-awesome :icon="faUser" class="mr-2"/>{{ $t('nav.profile') }}
            </NuxtLink>
            <NuxtLink
              v-if="isOrganizationAdmin"
              to="/admin"
              :class="['block px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors', { 'bg-neutral-100': isActive('/admin') }]"
              :prefetch="false"
            >
              <font-awesome :icon="faBriefcase" class="mr-2"/>{{ $t('nav.admin') }}
            </NuxtLink>
          </div>

          <div class="pt-4 mt-4 border-t border-neutral-200">
            <span class="block px-4 py-2 text-neutral-400 cursor-not-allowed">{{ $t('nav.help') }}</span>
            <button
              @click="handleLogout"
              class="block cursor-pointer w-full text-left px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors text-red-600"
            >
              <font-awesome :icon="faSignOutAlt" class="mr-2"/>{{ $t('common.logout') }}
            </button>
          </div>
        </nav>
      </aside>

      <article class="col-span-10">
        <slot />
      </article>

    </main>

  </div>

  <Footer />

</template>

<style scoped>

</style>
