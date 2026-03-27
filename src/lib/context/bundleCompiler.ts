/**
 * PM Flow — Bundle Compiler
 * Compiles selected files and sections into a single context bundle.
 */

import { type MarkdownSection } from './markdownParser';

export interface BundleItem {
  id: string;
  filePath: string;
  fileName: string;
  fullContent: string;
  selectedSections: string[];  // section IDs, empty = entire file
  sections: MarkdownSection[];
  order: number;
}

export interface Bundle {
  items: BundleItem[];
  metadata: BundleMetadata;
}

export interface BundleMetadata {
  fileCount: number;
  sectionCount: number;
  totalCharacters: number;
  estimatedTokens: number;
  createdAt: string;
}

/**
 * Compile bundle items into a single markdown string.
 */
export function compileBundle(items: BundleItem[]): string {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const parts: string[] = [];

  for (const item of sorted) {
    const content = getBundleItemContent(item);
    if (content.trim()) {
      parts.push(`<!-- File: ${item.fileName} -->\n${content}`);
    }
  }

  return parts.join('\n\n---\n\n');
}

/**
 * Get the content for a single bundle item.
 * If specific sections are selected, only include those.
 */
function getBundleItemContent(item: BundleItem): string {
  // If no specific sections selected, use full content
  if (item.selectedSections.length === 0) {
    return item.fullContent;
  }

  // Build content from selected sections
  const selectedParts: string[] = [];
  for (const section of item.sections) {
    if (item.selectedSections.includes(section.id)) {
      selectedParts.push(section.content);
    }
    // Also check children
    for (const child of section.children) {
      if (item.selectedSections.includes(child.id)) {
        selectedParts.push(child.content);
      }
    }
  }

  return selectedParts.join('\n\n');
}

/**
 * Compute metadata about a bundle.
 */
export function computeBundleMetadata(items: BundleItem[]): BundleMetadata {
  const compiled = compileBundle(items);
  const sectionCount = items.reduce(
    (acc, item) => acc + (item.selectedSections.length || item.sections.length),
    0
  );

  return {
    fileCount: items.length,
    sectionCount,
    totalCharacters: compiled.length,
    estimatedTokens: Math.ceil(compiled.length / 4), // rough estimate
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create a new bundle item from file data.
 */
export function createBundleItem(
  filePath: string,
  content: string,
  sections: MarkdownSection[],
  order: number
): BundleItem {
  const fileName = filePath.split('/').pop() || filePath;

  return {
    id: `bundle-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    filePath,
    fileName,
    fullContent: content,
    selectedSections: [],
    sections,
    order,
  };
}

/**
 * Reorder items in a bundle.
 */
export function reorderBundleItems(
  items: BundleItem[],
  fromIndex: number,
  toIndex: number
): BundleItem[] {
  const result = [...items];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  // Update order values
  return result.map((item, index) => ({
    ...item,
    order: index,
  }));
}

/**
 * Toggle a section selection on a bundle item.
 */
export function toggleBundleSection(
  item: BundleItem,
  sectionId: string
): BundleItem {
  const isSelected = item.selectedSections.includes(sectionId);
  return {
    ...item,
    selectedSections: isSelected
      ? item.selectedSections.filter(id => id !== sectionId)
      : [...item.selectedSections, sectionId],
  };
}

/**
 * Format bundle for clipboard copy.
 */
export function formatBundleForCopy(items: BundleItem[]): string {
  const compiled = compileBundle(items);
  const metadata = computeBundleMetadata(items);

  return [
    `<!-- PM Flow Bundle -->`,
    `<!-- Files: ${metadata.fileCount} | Sections: ${metadata.sectionCount} | ~${metadata.estimatedTokens} tokens -->`,
    `<!-- Generated: ${metadata.createdAt} -->`,
    '',
    compiled,
  ].join('\n');
}
