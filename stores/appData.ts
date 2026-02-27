import { defineStore } from 'pinia';
import { useAuthAwareApiCache } from '~/composables/useAuthAwareApiCache';
import { apiService } from '~/services/api';

// Define here the type of data received from the API
interface AppData {
  languages: string[];
  timestamp: string;
  // Add here the specific fields from the API
  [key: string]: any;
}

interface AppState {
  data: AppData | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
}

export const useAppDataStore = defineStore('appData', {
  state: (): AppState => ({
    data: null,
    isLoading: false,
    error: null,
    lastFetch: null,
    isInitialized: false,
    isAuthenticated: false
  }),

  getters: {
    /**
     * Indicates if there is data available
     */
    hasData: (state): boolean => state.data !== null,

    /**
     * Indicates if the app is ready (data loaded or error handled)
     */
    isReady: (state): boolean => state.isInitialized && !state.isLoading,

    /**
     * Indicates if data can be loaded (authenticated and not on public route)
     */
    canLoadData: (state): boolean => state.isAuthenticated,

    /**
     * Time since last successful fetch in milliseconds (or null if never)
     */
    timeSinceLastFetch: (state): number | null => {
      if (!state.lastFetch) return null;
      return Date.now() - state.lastFetch.getTime();
    },

    /**
     * List of available language codes
     */
    availableLanguages: (state): string[] => {
      return state.data?.languages || [];
    },
  },

  actions: {
    /**
     * Updates the authentication state
     */
    updateAuthState(): void {
      const token = useCookie('auth-token').value;
      this.isAuthenticated = !!token;
    },

    /**
     * Loads the application data from the API or cache
     */
    async loadAppData(forceRefresh = false): Promise<void> {
      // Update authentication state first
      this.updateAuthState();

      // If not authenticated, don't load data
      if (!this.isAuthenticated) {
        console.log('🔒 User not authenticated, skipping data load');
        this.isInitialized = true;
        return;
      }

      // If already loading, do nothing
      if (this.isLoading) return;

      this.isLoading = true;
      this.error = null;

      try {
        const authCache = useAuthAwareApiCache<AppData>({
          cacheKey: 'app-initialization-data',
          cacheDuration: 4 * 60 * 60 * 1000, // 4 hours
          requireAuth: true
        });

        const fetchAppData = async (): Promise<AppData> => {
          // Only execute if authenticated
          const languages = await apiService.getLanguages().catch(() => []);

          return {
            languages,
            timestamp: new Date().toISOString()
          };
        };

        // Use authentication-aware cache
        const data = await authCache.withAuthCache(fetchAppData, forceRefresh);
        
        if (data) {
          this.data = data;
          this.lastFetch = new Date();
          this.error = null;

          console.log('✅ App Data loaded with auth:', {
            fromCache: !forceRefresh && authCache.isAuthCacheValid(),
            timestamp: this.lastFetch,
            cacheInfo: authCache.getAuthCacheInfo()
          });
        } else {
          console.log('🔒 No data loaded due to authentication restrictions');
        }

      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error loading app data:', error);
        
        // If authentication error, clear state
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          this.clearAppData();
          this.isAuthenticated = false;
        } else {
          // Try to load data from cache as fallback only if authenticated
          if (this.isAuthenticated) {
            const authCache = useAuthAwareApiCache<AppData>({ 
              cacheKey: 'app-initialization-data',
              requireAuth: true 
            });
            const fallbackData = authCache.getAuthCachedData();
            
            if (fallbackData) {
              this.data = fallbackData;
              console.warn('⚠️ Using cached data as fallback');
            }
          }
        }
      } finally {
        this.isLoading = false;
        this.isInitialized = true;
      }
    },

    /**
     * Forces the data to be refreshed
     */
    async refreshAppData(): Promise<void> {
      await this.loadAppData(true);
    },

    /**
     * Clears the data and cache
     */
    clearAppData(): void {
      this.data = null;
      this.lastFetch = null;
      this.error = null;
      this.isInitialized = false;
      this.isAuthenticated = false;

      // Clear cache using authentication-aware method
      const authCache = useAuthAwareApiCache({ 
        cacheKey: 'app-initialization-data',
        requireAuth: false // Allow clearing even without auth
      });
      authCache.clearAuthData();

      console.log('🧹 Application and authentication data cleared');
    },

    /**
     * Updates specific data without making a full request
     */
    updateAppData(updates: Partial<AppData>): void {
      if (this.data && this.isAuthenticated) {
        this.data = { ...this.data, ...updates };
        
        // Update cache with new data
        const authCache = useAuthAwareApiCache<AppData>({ 
          cacheKey: 'app-initialization-data',
          requireAuth: true 
        });
        authCache.setAuthCachedData(this.data);
      }
    },

    /**
     * Gets the current cache status
     */
    getCacheStatus() {
      const authCache = useAuthAwareApiCache({ 
        cacheKey: 'app-initialization-data',
        requireAuth: true 
      });
      return authCache.getAuthCacheInfo();
    },

    /**
     * Handles user logout
     */
    async logout(): Promise<void> {
      // Clear all data
      this.clearAppData();
      
      // Redirect to login
      await navigateTo('/login');
      
      console.log('👋 User disconnected and data cleared');
    },

    /**
     * Initializes the store (used by plugin)
     */
    async initialize(): Promise<void> {
      // Update authentication state
      this.updateAuthState();
      
      // Only initialize if authenticated and not initialized
      if (this.isAuthenticated && !this.isInitialized) {
        await this.loadAppData();
      } else if (!this.isAuthenticated) {
        // Mark as initialized even if no data is loaded
        this.isInitialized = true;
        console.log('🔓 Initialization completed without loading data (not authenticated)');
      }
    },

    /**
     * Reacts to authentication changes
     */
    setupAuthWatcher(): void {
      if (process.client) {
        const authCache = useAuthAwareApiCache();
        
        // Watch for authentication state changes
        authCache.onAuthChange(async (isAuth) => {
          this.isAuthenticated = isAuth;
          
          if (isAuth && !this.hasData) {
            // If authenticated and no data, load them
            await this.loadAppData();
          } else if (!isAuth) {
            // If loses authentication, clear data
            this.clearAppData();
          }
        });

        // Watch for route changes
        authCache.onRouteChange(async (shouldLoad) => {
          if (shouldLoad && this.isAuthenticated && !this.hasData) {
            // If route change requires data and user is authenticated
            await this.loadAppData();
          }
        });
      }
    }
  }
});
