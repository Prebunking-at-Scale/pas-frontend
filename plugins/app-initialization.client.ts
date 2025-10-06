export default defineNuxtPlugin({
  name: 'app-initialization',
  parallel: false, // Ensure it runs in order
  async setup() {
    // Only run on client
    if (process.server) return;

    const appStore = useAppDataStore();
    const route = useRoute();
    
    console.log('🚀 Initializing authentication-aware system...');

    try {
      // Setup authentication and route watchers
      appStore.setupAuthWatcher();
      
      // Initialize the store (will check authentication internally)
      await appStore.initialize();
      
      console.log('✅ System initialized correctly', {
        isAuthenticated: appStore.isAuthenticated,
        hasData: appStore.hasData,
        currentRoute: route.path
      });
      
      // Setup periodic verification only for authenticated users
      if (process.client) {
        const checkInterval = 30 * 60 * 1000; // 30 minutes
        
        setInterval(async () => {
          // Only verify if authenticated
          if (!appStore.isAuthenticated) return;
          
          const cacheInfo = appStore.getCacheStatus();
          
          // If cache has expired, update automatically
          if (cacheInfo && !cacheInfo.canUseCache) {
            console.log('🔄 Cache expired for authenticated user, updating data...');
            await appStore.refreshAppData();
          }
        }, checkInterval);
      }
      
    } catch (error) {
      console.error('❌ Error during initialization:', error);
      
      // In case of error, ensure state is clean
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        console.log('🔐 Authentication error during initialization, clearing data...');
        appStore.clearAppData();
        await navigateTo('/login');
      }
    }
  }
});