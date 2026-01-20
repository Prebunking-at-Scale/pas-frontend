import { useApiCache } from './useApiCache';

interface AuthAwareCacheOptions {
  /**
   * Duration of the cache in milliseconds
   * @default 4 * 60 * 60 * 1000 (4 hours)
   */
  cacheDuration?: number;
  /**
   * Unique key for the cache
   * @default 'auth-app-cache'
   */
  cacheKey?: string;
  /**
   * Whether to check authentication before each operation
   * @default true
   */
  requireAuth?: boolean;
  /**
   * Routes that do not require authentication
   * @default ['/login', '/password-reset', '/terms-of-service']
   */
  publicRoutes?: string[];
}

export const useAuthAwareApiCache = <T = any>(options: AuthAwareCacheOptions = {}) => {
  const {
    cacheDuration = 4 * 60 * 60 * 1000, // 4 hours
    cacheKey = 'auth-app-cache',
    requireAuth = true,
    publicRoutes = ['/login', '/password-reset', '/terms-of-service']
  } = options;

  const router = useRouter();
  const route = useRoute();

  // Initialize base cache
  const cache = useApiCache<T>({
    cacheDuration,
    cacheKey
  });

  /**
   * Check if the user is authenticated
   */
  const isAuthenticated = (): boolean => {
    try {
      const token = useCookie('auth-token').value;
      return !!token;
    } catch (error) {
      console.warn('Error checking authentication:', error);
      return false;
    }
  };

  /**
   * Check if the current route is public
   */
  const isPublicRoute = (path?: string): boolean => {
    const currentPath = path || route.path;
    return publicRoutes.some(route => currentPath.startsWith(route));
  };

  /**
   * Check if we should load data based on authentication and route
   */
  const shouldLoadData = (): boolean => {
    // If no auth is required, always load
    if (!requireAuth) return true;
    
    if (isPublicRoute()) return false;

    // Only load if authenticated
    return isAuthenticated();
  };

  /**
   * Returns cached data only if the user is authenticated
   */
  const getAuthCachedData = (): T | null => {
    if (!shouldLoadData()) {
      return null;
    }
    
    return cache.getCachedData();
  };

  /**
   * Returns cached data only if the user is authenticated
   */
  const setAuthCachedData = (data: T): void => {
    if (!shouldLoadData()) {
      console.warn('Cannot save data: user not authenticated or on public route');
      return;
    }
    
    cache.setCachedData(data);
  };

  /**
   * Runs a function with authentication-aware caching
   */
  const withAuthCache = async <R = T>(
    fetchFunction: () => Promise<R>,
    forceRefresh = false
  ): Promise<R | null> => {
    // Check if we should load data
    if (!shouldLoadData()) {
      console.log('🔒 Skipping data load: user not authenticated or on public route');
      return null;
    }

    try {
      // Use authentication-aware cache if it passes auth checks
      const result = await cache.withCache(fetchFunction as () => Promise<R>, forceRefresh);
      return result as R;
    } catch (error) {
      console.error('Error in withAuthCache:', error);
      
      // If authentication error (401), clear data and redirect
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        clearAuthData();
        await navigateTo('/login');
        return null;
      }
      
      throw error;
    }
  };

  /**
   * Clears cache and authentication cookies (useful for logout)
   */
  const clearAuthData = (): void => {
    cache.clearCache();

    // Also clear authentication cookies
    const tokenCookie = useCookie('auth-token');
    const orgCookie = useCookie('organization-id');
    const userCookie = useCookie('user');
    
    tokenCookie.value = null;
    orgCookie.value = null;
    userCookie.value = null;
    
    console.log('🧹 Authentication and cache data cleared');
  };

  /**
   * Initializes data only if authenticated (useful for app startup)
   */
  const initializeAuthData = async <R = T>(
    fetchFunction: () => Promise<R>
  ): Promise<R | null> => {
    // Check authentication before initializing
    if (!shouldLoadData()) {
      console.log('🚫 Initialization skipped: not authenticated or on public route');
      return null;
    }

    try {
      return await withAuthCache(fetchFunction);
    } catch (error) {
      console.error('Error during auth initialization:', error);
      return null;
    }
  };

  /**
   * Checks if the cache is valid considering authentication
   */
  const isAuthCacheValid = (): boolean => {
    return shouldLoadData() && cache.isCacheValid();
  };

  /**
   * Returns detailed cache info including authentication state
   */
  const getAuthCacheInfo = () => {
    const baseInfo = cache.getCacheInfo();
    const authInfo = {
      isAuthenticated: isAuthenticated(),
      isPublicRoute: isPublicRoute(),
      shouldLoadData: shouldLoadData(),
      currentRoute: route.path
    };

    return {
      ...baseInfo,
      auth: authInfo,
      canUseCache: shouldLoadData() && baseInfo?.isValid
    };
  };

  /**
   * Hook to react to route changes
   */
  const onRouteChange = (callback: (shouldLoad: boolean) => void) => {
    watch(() => route.path, (newPath) => {
      const shouldLoad = shouldLoadData();
      callback(shouldLoad);
      
      if (!shouldLoad && !isPublicRoute(newPath)) {
        // If route requires auth but user is not authenticated
        console.log('🔐 Route requires authentication, redirecting...');
        navigateTo('/login');
      }
    }, { immediate: true });
  };

  /**
   * Hook to react to authentication state changes
   */
  const onAuthChange = (callback: (isAuth: boolean) => void) => {
    const tokenCookie = useCookie('auth-token');
    
    watch(() => tokenCookie.value, (newToken) => {
      const isAuth = !!newToken;
      callback(isAuth);
      
      if (!isAuth && !isPublicRoute()) {
        // If lost authentication on protected route
        clearAuthData();
        navigateTo('/login');
      }
    }, { immediate: true });
  };

  return {
    // Cache methods with authentication
    getAuthCachedData,
    setAuthCachedData,
    withAuthCache,
    initializeAuthData,

    // Utilities for authentication
    isAuthenticated,
    isPublicRoute,
    shouldLoadData,
    clearAuthData,
    
    // state info
    isAuthCacheValid,
    getAuthCacheInfo,
    
    // reactive hooks
    onRouteChange,
    onAuthChange,

    // Access to base methods if needed
    cache
  };
};