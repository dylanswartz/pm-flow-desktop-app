/**
 * PM Flow — Frontmatter Parser
 * Parses YAML frontmatter from markdown files.
 */

export interface Frontmatter {
  title?: string;
  type?: string;
  domain?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface ParsedDocument {
  frontmatter: Frontmatter;
  content: string;
  raw: string;
}

/**
 * Parse markdown content into frontmatter + body.
 * Uses a simple regex-based parser to avoid gray-matter's Node.js dependencies.
 */
export function parseFrontmatter(raw: string): ParsedDocument {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;
  const match = raw.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: {},
      content: raw,
      raw,
    };
  }

  const yamlStr = match[1];
  const content = match[2];
  const frontmatter = parseYaml(yamlStr);

  return { frontmatter, content, raw };
}

/**
 * Simple YAML parser for frontmatter fields.
 * Handles: strings, lists, and simple key-value pairs.
 */
function parseYaml(yaml: string): Frontmatter {
  const result: Frontmatter = {};
  const lines = yaml.split('\n');
  let currentKey = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Array item (- value)
    if (trimmed.startsWith('- ')) {
      if (currentKey) {
        if (!Array.isArray(result[currentKey])) {
          result[currentKey] = [];
        }
        (result[currentKey] as string[]).push(trimmed.substring(2).trim().replace(/^["']|["']$/g, ''));
      }
      continue;
    }

    // Key-value pair
    const kvMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();

      if (value === '' || value === '[]') {
        // Empty value or start of list — will be populated by subsequent - items
        result[currentKey] = value === '[]' ? [] : '';
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Inline array: [tag1, tag2]
        result[currentKey] = value
          .slice(1, -1)
          .split(',')
          .map(s => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else {
        // Simple string value
        result[currentKey] = value.replace(/^["']|["']$/g, '');
      }
    }
  }

  return result;
}

/**
 * Serialize frontmatter back to YAML string.
 */
export function serializeFrontmatter(fm: Frontmatter): string {
  const lines: string[] = ['---'];

  for (const [key, value] of Object.entries(fm)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${item}`);
        }
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * Reconstruct full markdown from frontmatter + content.
 */
export function reconstructDocument(fm: Frontmatter, content: string): string {
  const hasFrontmatter = Object.keys(fm).length > 0;

  if (!hasFrontmatter) {
    return content;
  }

  return `${serializeFrontmatter(fm)}\n\n${content}`;
}
