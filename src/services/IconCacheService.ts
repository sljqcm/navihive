/**
 * Icon Cache Service
 * Handles icon fetching with multi-source fallback and localStorage caching
 */

import { isSecureIconUrl, extractDomain } from '../utils/url';
import {
  getLocalStorageItem,
  setLocalStorageItem,
  isCacheExpired,
  isValidCacheEntry,
} from '../utils/localStorage';

export interface IconCacheEntry {
  url: string;
  timestamp: number;
  source: 'google' | 'duckduckgo' | 'clearbit' | 'custom';
}

interface IconCacheData {
  [domain: string]: IconCacheEntry;
}

const ICON_CACHE_KEY = 'navihive.iconCache';
const CACHE_EXPIRATION_DAYS = 7;

export interface IconCacheService {
  getIcon(domain: string, customUrl?: string): Promise<string>;
  clearCache(): void;
  getCacheStats(): { size: number; entries: number };
}

/**
 * Test if an image URL is accessible
 */
async function testImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;

    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
}

/**
 * Generate fallback letter icon using first character of domain
 */
function generateLetterIcon(domain: string): string {
  const letter = domain.charAt(0).toUpperCase();
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }

  // Background
  ctx.fillStyle = '#1976d2';
  ctx.fillRect(0, 0, 128, 128);

  // Letter
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 64, 64);

  return canvas.toDataURL('image/png');
}

/**
 * Create icon cache service instance
 */
export function createIconCacheService(): IconCacheService {
  /**
   * Load cache from localStorage
   */
  function loadCache(): IconCacheData {
    return getLocalStorageItem<IconCacheData>(ICON_CACHE_KEY, {});
  }

  /**
   * Save cache to localStorage
   */
  function saveCache(cache: IconCacheData): void {
    setLocalStorageItem(ICON_CACHE_KEY, cache);
  }

  /**
   * Cache an icon URL
   */
  function cacheIcon(domain: string, url: string, source: IconCacheEntry['source']): void {
    const cache = loadCache();
    cache[domain] = {
      url,
      timestamp: Date.now(),
      source,
    };
    saveCache(cache);
  }

  /**
   * Get icon with multi-source fallback
   */
  async function getIcon(domain: string, customUrl?: string): Promise<string> {
    // Validate domain
    if (!domain || typeof domain !== 'string') {
      return generateLetterIcon('?');
    }

    // Extract clean domain
    const cleanDomain = extractDomain(domain) || domain;

    // Check cache
    const cache = loadCache();
    const cached = cache[cleanDomain];

    if (
      cached &&
      isValidCacheEntry(cached) &&
      !isCacheExpired(cached.timestamp, CACHE_EXPIRATION_DAYS)
    ) {
      return cached.url;
    }

    // Try custom URL first
    if (customUrl && isSecureIconUrl(customUrl)) {
      try {
        const success = await testImageUrl(customUrl);
        if (success) {
          cacheIcon(cleanDomain, customUrl, 'custom');
          return customUrl;
        }
      } catch (error) {
        console.warn(`Custom icon failed for ${cleanDomain}:`, error);
      }
    }

    // Try icon sources in priority order
    const sources: Array<{ name: IconCacheEntry['source']; url: string }> = [
      {
        name: 'google',
        url: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=128`,
      },
      {
        name: 'duckduckgo',
        url: `https://icons.duckduckgo.com/ip3/${encodeURIComponent(cleanDomain)}.ico`,
      },
      {
        name: 'clearbit',
        url: `https://logo.clearbit.com/${encodeURIComponent(cleanDomain)}`,
      },
    ];

    for (const source of sources) {
      try {
        const success = await testImageUrl(source.url);
        if (success) {
          cacheIcon(cleanDomain, source.url, source.name);
          return source.url;
        }
      } catch (error) {
        console.warn(`Icon source ${source.name} failed for ${cleanDomain}:`, error);
      }
    }

    // All sources failed, return fallback letter icon
    const fallbackUrl = generateLetterIcon(cleanDomain);
    return fallbackUrl;
  }

  /**
   * Clear all cached icons
   */
  function clearCache(): void {
    saveCache({});
  }

  /**
   * Get cache statistics
   */
  function getCacheStats(): { size: number; entries: number } {
    const cache = loadCache();
    const entries = Object.keys(cache).length;

    // Estimate size in bytes
    const cacheString = JSON.stringify(cache);
    const size = new Blob([cacheString]).size;

    return { size, entries };
  }

  return {
    getIcon,
    clearCache,
    getCacheStats,
  };
}
