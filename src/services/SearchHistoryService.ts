/**
 * Search History Service
 * Manages search history with localStorage persistence
 */

import {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
} from '../utils/localStorage';

export interface SearchHistoryEntry {
  query: string;
  timestamp: number;
  resultCount: number;
}

interface SearchHistoryData {
  entries: SearchHistoryEntry[];
  maxEntries: number;
}

const SEARCH_HISTORY_KEY = 'navihive.searchHistory';
const DEFAULT_MAX_ENTRIES = 20;

export interface SearchHistoryService {
  addEntry(query: string, resultCount: number): void;
  getHistory(limit?: number): SearchHistoryEntry[];
  clearHistory(): void;
  removeEntry(query: string): void;
}

/**
 * Validate search history entry structure
 */
function isValidHistoryEntry(value: unknown): value is SearchHistoryEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'query' in value &&
    'timestamp' in value &&
    'resultCount' in value &&
    typeof (value as SearchHistoryEntry).query === 'string' &&
    typeof (value as SearchHistoryEntry).timestamp === 'number' &&
    typeof (value as SearchHistoryEntry).resultCount === 'number'
  );
}

/**
 * Validate search history data structure
 */
function isValidHistoryData(value: unknown): value is SearchHistoryData {
  if (typeof value !== 'object' || value === null) return false;
  if (!('entries' in value) || !('maxEntries' in value)) return false;

  const data = value as SearchHistoryData;
  if (!Array.isArray(data.entries)) return false;
  if (typeof data.maxEntries !== 'number') return false;

  return data.entries.every(isValidHistoryEntry);
}

/**
 * Create search history service instance
 */
export function createSearchHistoryService(
  maxEntries: number = DEFAULT_MAX_ENTRIES
): SearchHistoryService {
  /**
   * Load history from localStorage
   */
  function loadHistory(): SearchHistoryData {
    const defaultData: SearchHistoryData = {
      entries: [],
      maxEntries,
    };

    const data = getLocalStorageItem<SearchHistoryData>(
      SEARCH_HISTORY_KEY,
      defaultData,
      isValidHistoryData
    );

    return data;
  }

  /**
   * Save history to localStorage
   */
  function saveHistory(data: SearchHistoryData): void {
    setLocalStorageItem(SEARCH_HISTORY_KEY, data);
  }

  /**
   * Add entry to search history
   */
  function addEntry(query: string, resultCount: number): void {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const data = loadHistory();
    const timestamp = Date.now();

    // Remove duplicate entries (keep newest)
    const filteredEntries = data.entries.filter((entry) => entry.query !== trimmedQuery);

    // Add new entry at the beginning
    const newEntry: SearchHistoryEntry = {
      query: trimmedQuery,
      timestamp,
      resultCount,
    };

    filteredEntries.unshift(newEntry);

    // Enforce max entries limit
    if (filteredEntries.length > data.maxEntries) {
      filteredEntries.splice(data.maxEntries);
    }

    // Save updated history
    data.entries = filteredEntries;
    saveHistory(data);
  }

  /**
   * Get search history
   */
  function getHistory(limit?: number): SearchHistoryEntry[] {
    const data = loadHistory();
    const entries = data.entries;

    if (limit !== undefined && limit > 0) {
      return entries.slice(0, limit);
    }

    return entries;
  }

  /**
   * Clear all search history
   */
  function clearHistory(): void {
    removeLocalStorageItem(SEARCH_HISTORY_KEY);
  }

  /**
   * Remove specific entry from history
   */
  function removeEntry(query: string): void {
    const data = loadHistory();
    data.entries = data.entries.filter((entry) => entry.query !== query);
    saveHistory(data);
  }

  return {
    addEntry,
    getHistory,
    clearHistory,
    removeEntry,
  };
}
