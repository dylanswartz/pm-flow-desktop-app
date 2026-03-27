/**
 * PM Flow — Markdown Parser
 * Parses markdown into sections by heading for bundle building.
 */

export interface MarkdownSection {
  id: string;
  heading: string;
  level: number;          // 1-6
  content: string;        // Full section content including heading
  bodyContent: string;    // Content without the heading line
  startLine: number;
  endLine: number;
  children: MarkdownSection[];
}

export interface HeadingNode {
  id: string;
  text: string;
  level: number;
  line: number;
}

/**
 * Extract all headings from markdown content.
 */
export function extractHeadings(content: string): HeadingNode[] {
  const lines = content.split('\n');
  const headings: HeadingNode[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Match headings (# Heading)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      headings.push({ id, text, level, line: i });
    }
  }

  return headings;
}

/**
 * Parse markdown into a tree of sections by heading.
 */
export function parseSections(content: string): MarkdownSection[] {
  const lines = content.split('\n');
  const headings = extractHeadings(content);

  if (headings.length === 0) {
    return [{
      id: 'root',
      heading: '(Document)',
      level: 0,
      content: content,
      bodyContent: content,
      startLine: 0,
      endLine: lines.length - 1,
      children: [],
    }];
  }

  // Build flat sections first
  const flatSections: MarkdownSection[] = [];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const startLine = heading.line;
    const endLine = i < headings.length - 1 ? headings[i + 1].line - 1 : lines.length - 1;
    const sectionLines = lines.slice(startLine, endLine + 1);
    const bodyLines = lines.slice(startLine + 1, endLine + 1);

    flatSections.push({
      id: heading.id,
      heading: heading.text,
      level: heading.level,
      content: sectionLines.join('\n'),
      bodyContent: bodyLines.join('\n').trim(),
      startLine,
      endLine,
      children: [],
    });
  }

  // Handle content before first heading
  if (headings[0].line > 0) {
    const preContent = lines.slice(0, headings[0].line).join('\n').trim();
    if (preContent) {
      flatSections.unshift({
        id: 'preamble',
        heading: '(Preamble)',
        level: 0,
        content: preContent,
        bodyContent: preContent,
        startLine: 0,
        endLine: headings[0].line - 1,
        children: [],
      });
    }
  }

  // Build tree from flat sections
  return buildSectionTree(flatSections);
}

/**
 * Build a tree of sections from a flat list based on heading levels.
 */
function buildSectionTree(sections: MarkdownSection[]): MarkdownSection[] {
  const root: MarkdownSection[] = [];
  const stack: MarkdownSection[] = [];

  for (const section of sections) {
    // Pop stack until we find a parent at a higher level
    while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(section);
    } else {
      stack[stack.length - 1].children.push(section);
    }

    stack.push(section);
  }

  return root;
}

/**
 * Flatten a section tree into a list (depth-first).
 */
export function flattenSections(sections: MarkdownSection[]): MarkdownSection[] {
  const result: MarkdownSection[] = [];

  function walk(section: MarkdownSection) {
    result.push(section);
    for (const child of section.children) {
      walk(child);
    }
  }

  for (const section of sections) {
    walk(section);
  }

  return result;
}

/**
 * Get the text content of a section (without heading, trimmed).
 */
export function getSectionText(section: MarkdownSection): string {
  return section.bodyContent;
}
