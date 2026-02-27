interface CacheData<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  /**
   * Duration on milliseconds
   * @default 4 * 60 * 60 * 1000 (4 horas)
   */
  cacheDuration?: number;
  /**
   * Unique key for the cache
   * @default 'app-cache'
   */
  cacheKey?: string;
  /**
   * Whether to use sessionStorage instead of localStorage
   * @default false
   */
  useSessionStorage?: boolean;
}

export const useApiCache = <T = any>(options: CacheOptions = {}) => {
  const {
    cacheDuration = 4 * 60 * 60 * 1000, // 4 hours by default
    cacheKey = 'app-cache',
    useSessionStorage = false
  } = options;

  // Helper to get the correct storage
  const getStorage = () => {
    if (process.client) {
      return useSessionStorage ? sessionStorage : localStorage;
    }
    return null;
  };

  /**
   * Get data from the cache if valid
   */
  const getCachedData = (): T | null => {
    try {
      const storage = getStorage();
      if (!storage) return null;

      const cached = storage.getItem(cacheKey);
      if (!cached) return null;

      const cacheData: CacheData<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if the data has expired
      if (now > cacheData.expiresAt) {
        // Clear expired data
        clearCache();
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Error reading from cache:', error);
      clearCache();
      return null;
    }
  };

  /**
   * Save data in the cache with timestamp and expiration
   */
  const setCachedData = (data: T): void => {
    try {
      const storage = getStorage();
      if (!storage) return;

      const now = Date.now();
      const cacheData: CacheData<T> = {
        data,
        timestamp: now,
        expiresAt: now + cacheDuration
      };

      storage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error saving to cache:', error);
    }
  };

  /**
   * Clears the cache data
   */
  const clearCache = (): void => {
    try {
      const storage = getStorage();
      if (!storage) return;
      
      storage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  };

  /**
   * Verifies if the cached data is valid
   */
  const isCacheValid = (): boolean => {
    try {
      const storage = getStorage();
      if (!storage) return false;

      const cached = storage.getItem(cacheKey);
      if (!cached) return false;

      const cacheData: CacheData<T> = JSON.parse(cached);
      const now = Date.now();

      return now <= cacheData.expiresAt;
    } catch (error) {
      return false;
    }
  };

  /**
   * Gets info about the cache (exists, isValid, timestamps, time remaining, etc.)
   */
  const getCacheInfo = () => {
    try {
      const storage = getStorage();
      if (!storage) return null;

      const cached = storage.getItem(cacheKey);
      if (!cached) return null;

      const cacheData: CacheData<T> = JSON.parse(cached);
      const now = Date.now();
      const timeRemaining = Math.max(0, cacheData.expiresAt - now);

      return {
        exists: true,
        isValid: now <= cacheData.expiresAt,
        timestamp: cacheData.timestamp,
        expiresAt: cacheData.expiresAt,
        timeRemaining,
        timeRemainingHours: Math.floor(timeRemaining / (60 * 60 * 1000)),
        timeRemainingMinutes: Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))
      };
    } catch (error) {
      return null;
    }
  };

  /**
   * Executes a function and caches its result
   */
  const withCache = async <R = T>(
    fetchFunction: () => Promise<R>,
    forceRefresh = false
  ): Promise<R> => {
    // If we don't force refresh and there is valid cached data, return it
    if (!forceRefresh) {
      const cachedData = getCachedData() as R;
      if (cachedData !== null) {
        return cachedData;
      }
    }

    // Execute the function and cache the result
    try {
      const freshData = await fetchFunction();
      setCachedData(freshData as T);
      return freshData;
    } catch (error) {
      // If there is an error and we have cached data (even if expired),
      // we can return it as a fallback
      const fallbackData = getCachedData() as R;
      if (fallbackData !== null) {
        console.warn('API error, using cached data as fallback:', error);
        return fallbackData;
      }
      throw error;
    }
  };

  return {
    getCachedData,
    setCachedData,
    clearCache,
    isCacheValid,
    getCacheInfo,
    withCache
  };
};