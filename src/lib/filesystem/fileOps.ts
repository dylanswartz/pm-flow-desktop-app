/**
 * PM Flow — Filesystem Operations
 * Abstracts Tauri filesystem API for workspace operations.
 */

import { open } from '@tauri-apps/plugin-dialog';
import {
  readDir,
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
  stat,
  rename,
  copyFile,
  remove as tauriRemove,
} from '@tauri-apps/plugin-fs';

export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
  extension?: string;
}

export interface FileInfo {
  path: string;
  name: string;
  content: string;
  size: number;
  lastModified?: number;
}

/**
 * Open a native folder picker dialog.
 */
export async function selectWorkspaceFolder(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select PM Flow Workspace',
  });

  return selected as string | null;
}

/**
 * Recursively read a directory and build a tree of FileNodes.
 * Only includes .md files and directories that contain .md files.
 */
export async function readDirectoryTree(dirPath: string): Promise<FileNode[]> {
  try {
    const entries = await readDir(dirPath);
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      // Skip hidden files/directories
      if (entry.name?.startsWith('.')) continue;

      const fullPath = `${dirPath}/${entry.name}`;

      if (entry.isDirectory) {
        const children = await readDirectoryTree(fullPath);
        // Include all directories (so empty ones show up for new file creation)
        nodes.push({
          name: entry.name || '',
          path: fullPath,
          isDir: true,
          children,
        });
      } else if (entry.name?.endsWith('.md')) {
        nodes.push({
          name: entry.name || '',
          path: fullPath,
          isDir: false,
          extension: 'md',
        });
      }
    }

    // Sort: directories first, then alphabetically
    return nodes.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (err) {
    console.error(`Failed to read directory: ${dirPath}`, err);
    return [];
  }
}

/**
 * Read a text file and return its content.
 */
export async function readFileContent(filePath: string): Promise<string> {
  return await readTextFile(filePath);
}

/**
 * Write content to a text file. Creates parent directories if needed.
 */
export async function writeFileContent(filePath: string, content: string): Promise<void> {
  // Ensure parent directory exists
  const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
  const dirExists = await exists(parentDir);
  if (!dirExists) {
    await mkdir(parentDir, { recursive: true });
  }
  await writeTextFile(filePath, content);
}

/**
 * Create a new directory. Supports recursive creation.
 */
export async function createDirectory(dirPath: string): Promise<void> {
  const dirExists = await exists(dirPath);
  if (!dirExists) {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * Move or rename a file or directory.
 */
export async function moveNode(oldPath: string, newPath: string): Promise<void> {
  await rename(oldPath, newPath);
}

/**
 * Delete a file or directory.
 */
export async function deleteNode(path: string, isDir: boolean): Promise<void> {
  await tauriRemove(path, { recursive: isDir });
}

/**
 * Duplicate a file. Generates a unique " Copy" suffix.
 */
export async function duplicateFile(path: string): Promise<string> {
  console.log('[fileOps] duplicateFile called with path:', path);
  const dirPath = path.substring(0, path.lastIndexOf('/'));
  const filename = path.substring(path.lastIndexOf('/') + 1);
  const ext = filename.endsWith('.md') ? '.md' : '';
  let baseName = filename.substring(0, filename.length - ext.length);
  
  // If baseline already ends with " Copy" or " Copy-n", strip it to cleanly increment.
  // Although the prompt just says auto go to renaming, we should ensure clean copies.
  let newName = `${baseName} Copy${ext}`;
  let newPath = `${dirPath}/${newName}`;
  let counter = 1;
  while (await exists(newPath)) {
    newName = `${baseName} Copy-${counter}${ext}`;
    newPath = `${dirPath}/${newName}`;
    counter++;
  }
  
  console.log('[fileOps] Copying to new path:', newPath);
  await copyFile(path, newPath);
  return newPath;
}

/**
 * Check if a file exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  return await exists(filePath);
}

/**
 * Get file info (name, size, etc.)
 */
export async function getFileInfo(filePath: string): Promise<{ size: number; isFile: boolean }> {
  const info = await stat(filePath);
  return {
    size: info.size,
    isFile: info.isFile,
  };
}

/**
 * Get all markdown files in a workspace (flat list).
 */
export async function getAllMarkdownFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(path: string) {
    try {
      const entries = await readDir(path);
      for (const entry of entries) {
        if (entry.name?.startsWith('.')) continue;
        const fullPath = `${path}/${entry.name}`;
        if (entry.isDirectory) {
          await walk(fullPath);
        } else if (entry.name?.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip unreadable directories
    }
  }

  await walk(dirPath);
  return files.sort();
}

/**
 * Generate a filename from a title.
 */
export function titleToFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() + '.md';
}

/**
 * Get relative path from workspace root.
 */
export function getRelativePath(workspacePath: string, filePath: string): string {
  if (filePath.startsWith(workspacePath)) {
    return filePath.substring(workspacePath.length + 1);
  }
  return filePath;
}

/**
 * Create a starter workspace with example domains and templates.
 */
export async function generateExampleWorkspace(basePath: string): Promise<string> {
  const workspacePath = `${basePath}/pm-flow-workspace`;
  
  if (!(await exists(workspacePath))) {
    await mkdir(workspacePath, { recursive: true });
  }

  const dirs = [
    `${workspacePath}/00_templates`,
    `${workspacePath}/01_domains/project-phoenix/admin-dashboard`,
    `${workspacePath}/02_daily`,
    `${workspacePath}/03_exports`
  ];
  for (const dir of dirs) {
    if (!(await exists(dir))) {
      await mkdir(dir, { recursive: true });
    }
  }

  const templateStr = `---
title: <Title>
type: context
domain: <domain>
area: <area>
---

# TLDR
# Problem Definition
# User & Use Case Context
# Current State
# Desired Outcome
# Constraints & Guardrails
# Open Questions
# Iteration Log
# Agent Instructions
`;
  await writeFileContent(`${workspacePath}/00_templates/context-template.md`, templateStr);
  await writeFileContent(`${workspacePath}/01_domains/project-phoenix/shared-context.md`, `# Project Phoenix Shared Context\n\nHigh-level domain knowledge about Project Phoenix goes here.`);
  await writeFileContent(`${workspacePath}/01_domains/project-phoenix/terminology.md`, `# Terminology\n\n- **Project**: A top-level container for all assets.\n- **Phoenix**: The code name for our next-gen platform.`);
  await writeFileContent(`${workspacePath}/01_domains/project-phoenix/admin-dashboard/context.md`, `---
title: Admin Dashboard
type: context
domain: project-phoenix
area: admin-dashboard
---

# TLDR
Centralized management console for Project Phoenix.

# Problem Definition
Internal teams need a way to manage user permissions and monitor system health.
`);
  await writeFileContent(`${workspacePath}/01_domains/project-phoenix/admin-dashboard/notes.md`, `# Scratchpad\n\n- Should we use React for the frontend?\n- Needs role-based access control (RBAC).`);
  await writeFileContent(`${workspacePath}/01_domains/project-phoenix/admin-dashboard/iterations.md`, `# History\n\nDecided to use standard Material Design components.`);

  return workspacePath;
}
