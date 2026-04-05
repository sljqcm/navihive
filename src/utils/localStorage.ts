/**
 * localStorage utility functions with safe JSON parsing, validation, and cache management
 */

/**
 * Safe JSON parse with error handling
 */
export function safeJSONParse<T>(value: string | null, defaultValue: T): T {
  if (!value) {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
}

/**
 * Safe JSON stringify with error handling
 */
export function safeJSONStringify<T>(value: T): string | null {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('JSON stringify error:', error);
    return null;
  }
}

/**
 * Safe localStorage getItem with validation
 */
export function getLocalStorageItem<T>(
  key: string,
  defaultValue: T,
  validator?: (value: unknown) => value is T
): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const rawValue = localStorage.getItem(key);
    const parsed = safeJSONParse(rawValue, defaultValue);

    if (validator && !validator(parsed)) {
      console.warn(`Invalid data structure for key: ${key}, using default value`);
      localStorage.removeItem(key);
      return defaultValue;
    }

    return parsed;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Safe localStorage setItem with error handling
 */
export function setLocalStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const stringified = safeJSONStringify(value);
    if (stringified === null) {
      return false;
    }

    localStorage.setItem(key, stringified);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded, attempting cleanup');
      // Attempt to free space by clearing old cache entries
      clearOldestCacheEntries();
      // Retry once
      try {
        const stringified = safeJSONStringify(value);
        if (stringified !== null) {
          localStorage.setItem(key, stringified);
          return true;
        }
      } catch (retryError) {
        console.error('Failed to save after cleanup:', retryError);
      }
    } else {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeLocalStorageItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
}

/**
 * Clear all localStorage items with a specific prefix
 */
export function clearLocalStorageByPrefix(prefix: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing localStorage by prefix:', error);
  }
}

/**
 * Get localStorage usage statistics
 */
export function getLocalStorageStats(): { used: number; available: number; percentage: number } {
  if (typeof window === 'undefined') {
    return { used: 0, available: 0, percentage: 0 };
  }

  try {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        used += key.length + (value?.length || 0);
      }
    }

    // Most browsers have 5-10MB limit, we'll use 5MB as conservative estimate
    const available = 5 * 1024 * 1024; // 5MB in bytes
    const percentage = (used / available) * 100;

    return { used, available, percentage };
  } catch (error) {
    console.error('Error calculating localStorage stats:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Clear oldest cache entries to free up space (LRU eviction)
 */
function clearOldestCacheEntries(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Find all cache entries with timestamps
    const cacheEntries: Array<{ key: string; timestamp: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('navihive.')) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            // Look for timestamp in various possible structures
            const timestamp =
              parsed.timestamp ||
              parsed.lastUpdated ||
              (parsed.entries && parsed.entries[0]?.timestamp) ||
              0;

            if (timestamp) {
              cacheEntries.push({ key, timestamp });
            }
          } catch {
            // Skip entries that can't be parsed
          }
        }
      }
    }

    // Sort by timestamp (oldest first)
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest 25% of entries
    const entriesToRemove = Math.ceil(cacheEntries.length * 0.25);
    for (let i = 0; i < entriesToRemove && i < cacheEntries.length; i++) {
      const entry = cacheEntries[i];
      if (entry) {
        localStorage.removeItem(entry.key);
      }
    }

    console.log(`Cleared ${entriesToRemove} oldest cache entries`);
  } catch (error) {
    console.error('Error clearing oldest cache entries:', error);
  }
}

/**
 * Validate cache entry structure
 */
export function isValidCacheEntry(value: unknown): value is {
  url: string;
  timestamp: number;
  source: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'url' in value &&
    'timestamp' in value &&
    'source' in value &&
    typeof (value as { url: unknown }).url === 'string' &&
    typeof (value as { timestamp: unknown }).timestamp === 'number' &&
    typeof (value as { source: unknown }).source === 'string'
  );
}

/**
 * Check if cache entry is expired
 */
export function isCacheExpired(timestamp: number, expirationDays: number = 7): boolean {
  const now = Date.now();
  const expirationMs = expirationDays * 24 * 60 * 60 * 1000;
  return now - timestamp > expirationMs;
}
