/**
 * PM Flow — Full-Text Search
 * Searches across markdown files in the workspace.
 */

import { readFileContent, getAllMarkdownFiles } from '../filesystem/fileOps';

export interface SearchResult {
  filePath: string;
  fileName: string;
  matches: SearchMatch[];
  totalMatches: number;
}

export interface SearchMatch {
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
  contextBefore?: string;
  contextAfter?: string;
}

/**
 * Search across all markdown files in a workspace.
 */
export async function searchFiles(
  workspacePath: string,
  query: string,
  options?: {
    caseSensitive?: boolean;
    maxResults?: number;
  }
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const files = await getAllMarkdownFiles(workspacePath);
  const results: SearchResult[] = [];
  const maxResults = options?.maxResults || 100;
  let totalFound = 0;

  for (const filePath of files) {
    if (totalFound >= maxResults) break;

    try {
      const content = await readFileContent(filePath);
      const matches = findMatches(content, query, options?.caseSensitive ?? false);

      if (matches.length > 0) {
        const fileName = filePath.split('/').pop() || filePath;
        results.push({
          filePath,
          fileName,
          matches: matches.slice(0, maxResults - totalFound),
          totalMatches: matches.length,
        });
        totalFound += matches.length;
      }
    } catch {
      // Skip unreadable files
    }
  }

  return results;
}

/**
 * Find all matches of a query in file content.
 */
function findMatches(content: string, query: string, caseSensitive: boolean): SearchMatch[] {
  const lines = content.split('\n');
  const searchQuery = caseSensitive ? query : query.toLowerCase();
  const matches: SearchMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const searchLine = caseSensitive ? line : line.toLowerCase();
    let idx = 0;

    while ((idx = searchLine.indexOf(searchQuery, idx)) !== -1) {
      matches.push({
        lineNumber: i + 1,
        lineContent: line.trim(),
        matchStart: idx,
        matchEnd: idx + query.length,
        contextBefore: i > 0 ? lines[i - 1]?.trim() : undefined,
        contextAfter: i < lines.length - 1 ? lines[i + 1]?.trim() : undefined,
      });
      idx += query.length;
    }
  }

  return matches;
}

/**
 * Highlight matching text in a string (returns HTML-safe result).
 */
export function highlightMatch(text: string, query: string): string {
  if (!query) return escapeHtml(text);

  const escaped = escapeHtml(text);
  const escapedQuery = escapeHtml(query);
  const regex = new RegExp(`(${escapeRegex(escapedQuery)})`, 'gi');

  return escaped.replace(regex, '<mark>$1</mark>');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
