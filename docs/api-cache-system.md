# API Cache System with Nuxt 3

This system provides a complete solution to execute API requests every time the user enters the application, with intelligent 4-hour caching.

## 🚀 Features

- ✅ **Automatic caching**: Data is saved in localStorage with 4-hour validity
- ✅ **Automatic initialization**: Executes when loading the application
- ✅ **Error handling**: Fallback to cached data in case of error
- ✅ **Reactivity**: Complete integration with Pinia for global state
- ✅ **Periodic verification**: Automatically checks if data has expired
- ✅ **TypeScript**: Fully typed for better DX

## 📁 Created Files

### 1. `composables/useApiCache.ts`
Composable that handles local storage and time validation.

### 2. `stores/appData.ts`
Pinia store that maintains API data in global state.

### 3. `plugins/app-initialization.client.ts`
Plugin that executes automatically when loading the application.


## 🎯 Configuration

### 1. Customize API endpoints

Edit the `stores/appData.ts` file in the `fetchAppData` function:

```typescript
const fetchAppData = async (): Promise<AppData> => {
  const { $fetch } = useNuxtApp();
  
  // Replace these endpoints with your actual API endpoints
  const [userResponse, settingsResponse, metadataResponse] = await Promise.all([
    $fetch('/api/user/profile'),
    $fetch('/api/app/settings'),
    $fetch('/api/app/metadata')
  ]);

  return {
    user: userResponse,
    settings: settingsResponse,
    metadata: metadataResponse,
    timestamp: new Date().toISOString()
  };
};
```

### 2. Customize data type

Modify the `AppData` interface in `stores/appData.ts` according to your needs:

```typescript
interface AppData {
  // Customize according to your API data
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    // Add more user fields
  };
  settings?: {
    theme: string;
    language: string;
    notifications: boolean;
    // Add more settings
  };
  // Add more sections as needed
  [key: string]: any;
}
```

### 3. Configure cache duration

To change the cache duration (default 4 hours):

```typescript
const cache = useApiCache<AppData>({
  cacheKey: 'app-initialization-data',
  cacheDuration: 4 * 60 * 60 * 1000 // 4 hours
});
```

## 📝 Usage in Components

### Use the store directly

```vue
<template>
  <div>
    <div v-if="appStore.isLoading">Loading...</div>
    <div v-else-if="appStore.hasData">
      <h1>Welcome {{ appStore.currentUser?.name }}</h1>
      <p>Theme: {{ appStore.appSettings?.theme }}</p>
    </div>
    <div v-else-if="appStore.error">
      Error: {{ appStore.error }}
    </div>
  </div>
</template>

<script setup>
const appStore = useAppDataStore();

// Data is already loaded automatically by the plugin
// But you can force an update if needed
const refresh = () => {
  appStore.refreshAppData();
};
</script>
```

### Use composables for specific cases

```vue
<script setup>
// For specific cache with different configuration
const { withCache, getCacheInfo } = useApiCache({
  cacheKey: 'specific-data',
  cacheDuration: 2 * 60 * 60 * 1000 // 2 hours
});

const specificData = ref(null);

const loadSpecificData = async () => {
  specificData.value = await withCache(async () => {
    return await $fetch('/api/specific-endpoint');
  });
};
</script>
```

## 🔧 API Reference

### `useApiCache(options?)`

#### Options:
- `cacheDuration`: Duration in milliseconds (default: 4 hours)
- `cacheKey`: Unique key for the cache (default: 'app-cache')
- `useSessionStorage`: Use sessionStorage instead of localStorage (default: false)

#### Methods:
- `getCachedData()`: Gets data from cache if valid
- `setCachedData(data)`: Saves data in cache
- `clearCache()`: Clears the cache
- `isCacheValid()`: Verifies if cache is valid
- `getCacheInfo()`: Detailed cache information
- `withCache(fetchFn, forceRefresh?)`: Executes function with automatic cache

### `useAppDataStore()`

#### State:
- `data`: Application data
- `isLoading`: Loading indicator
- `error`: Error message
- `isInitialized`: If the store was initialized

#### Getters:
- `hasData`: If there is available data
- `isReady`: If the application is ready
- `currentUser`: Current user information
- `appSettings`: Application settings

#### Actions:
- `loadAppData(forceRefresh?)`: Loads data from API or cache
- `refreshAppData()`: Forces update
- `clearAppData()`: Clears data and cache
- `updateAppData(updates)`: Updates specific data

## 🎮 Development Commands

### Clear cache manually

```javascript
// In the browser console
localStorage.removeItem('app-initialization-data');
```

### Check cache status

```javascript
// In the browser console
const appStore = useAppDataStore();
console.log(appStore.getCacheStatus());
```

### Force update

```javascript
// In any component
const appStore = useAppDataStore();
await appStore.refreshAppData();
```

## ⚙️ Advanced Configuration

### Multiple endpoints with different caches

```typescript
// In a custom composable
export const useMultipleApis = () => {
  const userCache = useApiCache({ cacheKey: 'user-data', cacheDuration: 2 * 60 * 60 * 1000 });
  const settingsCache = useApiCache({ cacheKey: 'settings-data', cacheDuration: 24 * 60 * 60 * 1000 });
  
  return {
    loadUserData: () => userCache.withCache(() => $fetch('/api/user')),
    loadSettings: () => settingsCache.withCache(() => $fetch('/api/settings'))
  };
};
```

### Event-based cache invalidation

```typescript
// In the store
export const useAppDataStore = defineStore('appData', {
  actions: {
    async onUserUpdate() {
      // Clear cache when user is updated
      this.clearAppData();
      await this.loadAppData();
    }
  }
});
```
## 📚 Additional Examples

### Intercept data changes

```vue
<script setup>
const appStore = useAppDataStore();

// React to data changes
watch(() => appStore.data, (newData) => {
  if (newData?.user) {
    // Configure analytics tracking
    // Update UI permissions
    // etc.
  }
}, { immediate: true });
</script>
```

### Conditional caching

```typescript
const { withCache } = useApiCache();

const loadData = async (userId: string) => {
  return await withCache(
    () => $fetch(`/api/users/${userId}`),
    // Force refresh if different user
    userId !== currentUserId.value
  );
};
```
