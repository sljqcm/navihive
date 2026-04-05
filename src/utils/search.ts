/**
 * 站内搜索工具函数
 * Enhanced with Levenshtein distance and similarity scoring
 */

import type { Group, Site } from '../API/http';

/**
 * 搜索结果项
 */
export interface SearchResultItem {
  type: 'site' | 'group';
  id: number;
  groupId?: number; // site 才有
  groupName?: string; // site 才有
  name: string;
  url?: string; // site 才有
  description?: string;
  notes?: string; // site 才有
  matchedFields: string[]; // 匹配到的字段名称，用于高亮显示
  score?: number; // 相似度分数
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Handle edge cases
  if (m === 0) return n;
  if (n === 0) return m;

  // Initialize distance matrix
  const matrix: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Fill first row and column
  for (let i = 0; i <= m; i++) {
    matrix[i]![0] = i;
  }
  for (let j = 0; j <= n; j++) {
    matrix[0]![j] = j;
  }

  // Fill matrix with minimum edit distances
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      const deletion = matrix[i - 1]![j]! + 1;
      const insertion = matrix[i]![j - 1]! + 1;
      const substitution = matrix[i - 1]![j - 1]! + cost;

      matrix[i]![j] = Math.min(deletion, insertion, substitution);
    }
  }

  return matrix[m]![n]!;
}

/**
 * Calculate similarity score between two strings (0.0 to 1.0)
 */
export function calculateSimilarity(text: string, query: string): number {
  // Handle edge cases
  if (!text && !query) return 1.0;
  if (!text || !query) return 0.0;

  // Normalize inputs
  const normalizedText = text.toLowerCase().trim();
  const normalizedQuery = query.toLowerCase().trim();

  // Exact match
  if (normalizedText === normalizedQuery) return 1.0;

  // Substring match (high score)
  if (normalizedText.includes(normalizedQuery)) return 0.9;

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalizedText, normalizedQuery);
  const maxLength = Math.max(normalizedText.length, normalizedQuery.length);

  // Convert distance to similarity score
  const similarity = 1.0 - distance / maxLength;

  return Math.max(0.0, Math.min(1.0, similarity));
}

/**
 * 搜索站点 (enhanced with similarity scoring)
 */
function searchSites(
  sites: Site[],
  query: string,
  groupsMap: Map<number, Group>,
  threshold: number = 0.3
): SearchResultItem[] {
  const results: SearchResultItem[] = [];
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return results;

  for (const site of sites) {
    const matchedFields: string[] = [];
    let maxScore = 0;

    // Calculate similarity scores for each field
    const nameScore = calculateSimilarity(site.name, lowerQuery);
    const urlScore = site.url ? calculateSimilarity(site.url, lowerQuery) * 0.8 : 0;
    const descScore = site.description
      ? calculateSimilarity(site.description, lowerQuery) * 0.6
      : 0;
    const notesScore = site.notes ? calculateSimilarity(site.notes, lowerQuery) * 0.6 : 0;

    // Track which fields matched
    if (nameScore >= threshold) {
      matchedFields.push('name');
      maxScore = Math.max(maxScore, nameScore);
    }
    if (urlScore >= threshold) {
      matchedFields.push('url');
      maxScore = Math.max(maxScore, urlScore);
    }
    if (descScore >= threshold) {
      matchedFields.push('description');
      maxScore = Math.max(maxScore, descScore);
    }
    if (notesScore >= threshold) {
      matchedFields.push('notes');
      maxScore = Math.max(maxScore, notesScore);
    }

    // If any field matches threshold, add to results
    if (matchedFields.length > 0 && site.id !== undefined) {
      const group = groupsMap.get(site.group_id);
      results.push({
        type: 'site',
        id: site.id,
        groupId: site.group_id,
        groupName: group?.name || '未知分组',
        name: site.name,
        url: site.url,
        description: site.description,
        notes: site.notes,
        matchedFields,
        score: maxScore,
      });
    }
  }

  return results;
}

/**
 * 搜索分组 (enhanced with similarity scoring)
 */
function searchGroups(groups: Group[], query: string, threshold: number = 0.3): SearchResultItem[] {
  const results: SearchResultItem[] = [];
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return results;

  for (const group of groups) {
    const matchedFields: string[] = [];

    // Calculate similarity score for group name
    const nameScore = calculateSimilarity(group.name, lowerQuery);

    if (nameScore >= threshold && group.id !== undefined) {
      matchedFields.push('name');
      results.push({
        type: 'group',
        id: group.id,
        name: group.name,
        matchedFields,
        score: nameScore,
      });
    }
  }

  return results;
}

/**
 * 站内搜索主函数 (enhanced with fuzzy matching)
 */
export function searchInternal(
  query: string,
  groups: Group[],
  sites: Site[],
  threshold: number = 0.3
): SearchResultItem[] {
  if (!query || !query.trim()) {
    return [];
  }

  // Limit query length to prevent DoS
  const sanitizedQuery = query.length > 200 ? query.substring(0, 200) : query;

  // 创建分组 ID 到分组的映射
  const groupsMap = new Map<number, Group>();
  for (const group of groups) {
    if (group.id !== undefined) {
      groupsMap.set(group.id, group);
    }
  }

  // 搜索站点和分组
  const siteResults = searchSites(sites, sanitizedQuery, groupsMap, threshold);
  const groupResults = searchGroups(groups, sanitizedQuery, threshold);

  // 合并结果并按分数排序
  const allResults = [...siteResults, ...groupResults];
  allResults.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Limit to top 50 results
  return allResults.slice(0, 50);
}

/**
 * 高亮匹配文本
 */
export function highlightMatch(text: string, query: string): string {
  if (!text || !query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return `${before}<mark>${match}</mark>${after}`;
}
