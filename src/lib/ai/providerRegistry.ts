/**
 * PM Flow — Provider Registry
 * Manages available AI providers and their configurations.
 */

import { type ProviderAdapter, type AiConfig } from './types';
import { AnthropicAdapter } from './anthropicAdapter';

const CONFIG_KEY = 'pmflow-ai-config';

class ProviderRegistryImpl {
  private adapters: Map<string, ProviderAdapter> = new Map();
  private config: AiConfig;

  constructor() {
    this.config = this.loadConfig();
    this.initAdapters();
  }

  /**
   * Get all registered providers.
   */
  getProviders(): ProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get a specific provider adapter.
   */
  getProvider(id: string): ProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  /**
   * Get the default provider.
   */
  getDefaultProvider(): ProviderAdapter | undefined {
    return this.adapters.get(this.config.defaultProvider);
  }

  /**
   * Get the full config.
   */
  getConfig(): AiConfig {
    return { ...this.config };
  }

  /**
   * Update a provider's API key.
   */
  setApiKey(providerId: string, apiKey: string): void {
    const providerConfig = this.config.providers.find(p => p.id === providerId);
    if (providerConfig) {
      providerConfig.apiKey = apiKey;
      providerConfig.enabled = apiKey.length > 0;
    } else {
      this.config.providers.push({
        id: providerId,
        apiKey,
        enabled: apiKey.length > 0,
      });
    }

    this.saveConfig();
    this.initAdapters();
  }

  /**
   * Check if a provider has an API key configured.
   */
  hasApiKey(providerId: string): boolean {
    const provider = this.config.providers.find(p => p.id === providerId);
    return !!provider?.apiKey;
  }

  /**
   * Get API key for a provider.
   */
  getApiKey(providerId: string): string {
    const provider = this.config.providers.find(p => p.id === providerId);
    return provider?.apiKey || '';
  }

  /**
   * Set the default provider.
   */
  setDefaultProvider(providerId: string): void {
    this.config.defaultProvider = providerId;
    this.saveConfig();
  }

  /**
   * Set the default model.
   */
  setDefaultModel(model: string): void {
    this.config.defaultModel = model;
    this.saveConfig();
  }

  private initAdapters(): void {
    this.adapters.clear();

    // Always register Anthropic
    const anthropicConfig = this.config.providers.find(p => p.id === 'anthropic');
    const anthropicKey = anthropicConfig?.apiKey || '';
    this.adapters.set('anthropic', new AnthropicAdapter(anthropicKey));
  }

  private loadConfig(): AiConfig {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }

    return {
      providers: [],
      defaultProvider: 'anthropic',
      defaultModel: 'claude-sonnet-4-20250514',
    };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch {
      console.error('Failed to save AI config');
    }
  }
}

// Singleton instance
export const providerRegistry = new ProviderRegistryImpl();
