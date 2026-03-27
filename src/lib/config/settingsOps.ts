/**
 * PM Flow — Settings & Template configuration
 * Manages JSON config file stored in the OS AppConfig directory.
 */

import { readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';

export interface FileTemplate {
  id: string;
  name: string;
  content: string;
}

export interface AppSettings {
  templates: FileTemplate[];
}

export const DEFAULT_TEMPLATES: FileTemplate[] = [
  {
    id: 'pm-context',
    name: 'PM Context',
    content: `---
title: <Title>
type: context
domain: <domain>
area: <area>
status: active
tags: []
updated: <date>
---

# TLDR

# Problem Definition

# User & Use Case Context

# Current State

# Desired Outcome

# Constraints & Guardrails

# Open Questions

# Iteration Log

# Agent Instructions`
  }
];

const SETTINGS_FILE = 'pmflow.config.json';

export async function loadSettings(): Promise<AppSettings> {
  try {
    const hasConfig = await exists(SETTINGS_FILE, { baseDir: BaseDirectory.AppConfig });
    if (!hasConfig) {
      await saveSettings({ templates: DEFAULT_TEMPLATES });
      return { templates: DEFAULT_TEMPLATES };
    }
    const content = await readTextFile(SETTINGS_FILE, { baseDir: BaseDirectory.AppConfig });
    return JSON.parse(content) as AppSettings;
  } catch (err) {
    console.warn('Failed to load settings (using defaults):', err);
    return { templates: DEFAULT_TEMPLATES };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  // Ensure the AppConfig directory exists before creating the file
  const dirExists = await exists('', { baseDir: BaseDirectory.AppConfig });
  if (!dirExists) {
    await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
  }
  await writeTextFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), { baseDir: BaseDirectory.AppConfig });
}
