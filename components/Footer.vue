<template>
  <footer class="bg-stone-900 mt-16 border-t border-neutral-200 p-12 text-white">
    <div class="grid grid-cols-12 gap-8">
      <!-- About Section -->
      <div class="col-span-4">
        <a href="/">
        <img 
          src="assets/images/prebunking-logo.png" 
          class="max-h-16"
          style="filter: brightness(0) invert(1);"
        />
      </a>
        <p class="text-sm mt-4 text-gray-300" v-if="false">{{ $t('footer.about.description') }}</p>
        <p class="text-sm mt-2 text-gray-300">{{ $t('footer.about.attribution') }}</p>
      </div>

      <!-- Quick Links -->
      <div class="col-span-2" v-if="false">
        <h3 class="font-semibold text-gray-200 mb-3">{{ $t('footer.quickLinks.title') }}</h3>
        <ul class="space-y-2 text-sm">
          <li>
            <NuxtLink to="/dashboard" class="text-gray-300 hover:text-emerald-700">
              {{ $t('nav.overview') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/narratives" class="text-gray-300 hover:text-emerald-700">
              {{ $t('nav.narratives') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/claims" class="text-gray-300 hover:text-emerald-700">
              {{ $t('nav.claims') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/videos" class="text-gray-300 hover:text-emerald-700">
              {{ $t('nav.videos') }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Resources -->
      <div class="col-span-2" v-if="false">
        <h3 class="font-semibold text-gray-200 mb-3">{{ $t('footer.resources.title') }}</h3>
        <ul class="space-y-2 text-sm">
          <li>
            <a href="#" class="text-gray-300 hover:text-emerald-700">
              {{ $t('footer.resources.documentation') }}
            </a>
          </li>
          <li>
            <a href="#" class="text-gray-300 hover:text-emerald-700">
              {{ $t('footer.resources.apiDocs') }}
            </a>
          </li>
          <li>
            <a href="#" class="text-gray-300 hover:text-emerald-700">
              {{ $t('footer.resources.help') }}
            </a>
          </li>
        </ul>
      </div>

      <!-- Contact -->
      <div class="col-span-4" v-if="false">
        <h3 class="font-semibold text-gray-200 mb-3">{{ $t('footer.contact.title') }}</h3>
        <p class="text-sm text-gray-300 mb-2">{{ $t('footer.contact.description') }}</p>
        <a href="mailto:contact@example.com" class="text-sm text-emerald-700 hover:text-emerald-800">
          {{ $t('footer.contact.email') }}
        </a>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-between text-sm text-gray-500">
      <div>
        <p>{{ $t('footer.copyright', { year: new Date().getFullYear() }) }}</p>
      </div>
      <div class="flex items-center gap-6">
        <NuxtLink to="/terms-of-service" class="hover:text-gray-700">{{ $t('footer.terms') }}</NuxtLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Footer component - no additional logic needed
</script>