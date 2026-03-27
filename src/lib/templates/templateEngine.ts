export interface TemplateContext {
  title: string;
  domain?: string;
  area?: string;
  date?: string;
}

/**
 * Injects metadata into a template string.
 */
export function injectMetadata(template: string, context: TemplateContext): string {
  const now = new Date().toISOString().split('T')[0];
  let result = template;

  // Replace Title
  result = result.replace(/<Title>/g, context.title);
  
  // Replace Date
  const dateStr = context.date || now;
  result = result.replace(/<date>/g, dateStr);
  result = result.replace(/<YYYY-MM-DD>/g, dateStr);

  // Replace Domain
  result = result.replace(/<domain>/g, context.domain || 'general');

  // Replace Area
  result = result.replace(/<area>/g, context.area || 'root');

  return result;
}

/**
 * Infers domain and area from a file path.
 * Pattern: .../01_domains/[domain]/[area]/file.md
 * or: .../01_domains/[domain]/file.md
 */
export function inferContext(filePath: string, workspacePath: string): { domain?: string; area?: string } {
  // Normalize path by removing workspace prefix
  let relativePath = filePath;
  if (workspacePath && filePath.startsWith(workspacePath)) {
    relativePath = filePath.slice(workspacePath.length);
  }
  
  // Clean up slashes
  relativePath = relativePath.replace(/^[\/\\]+/, '');
  const parts = relativePath.split(/[\/\\]/);

  // Check if we are inside 01_domains
  const domainsIdx = parts.findIndex(p => p.includes('01_domains'));
  if (domainsIdx !== -1 && parts.length > domainsIdx + 1) {
    const domain = parts[domainsIdx + 1];
    const area = parts.length > domainsIdx + 2 ? parts[domainsIdx + 2] : undefined;
    
    // Check if the area part is actually a file (has .md)
    const cleanArea = area?.endsWith('.md') ? undefined : area;

    return { domain, area: cleanArea };
  }

  return {};
}
