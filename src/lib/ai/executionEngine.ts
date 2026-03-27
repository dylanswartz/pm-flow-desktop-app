/**
 * PM Flow — Execution Engine
 * Orchestrates the full AI task execution flow:
 * Bundle → Recipe → Prompt → Provider → Response
 */

import { type TaskRequest, type TaskResponse, type StreamHandlers, type ExecutionStatus, type TaskRecipe } from './types';
import { type BundleItem, compileBundle } from '../context/bundleCompiler';
import { applyRecipeTemplate } from './taskRecipes';
import { providerRegistry } from './providerRegistry';

export interface ExecutionOptions {
  recipe: TaskRecipe;
  bundleItems: BundleItem[];
  providerId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  customPrompt?: string;
  stream?: boolean;
}

export interface ExecutionCallbacks {
  onStatusChange: (status: ExecutionStatus) => void;
  onToken?: (token: string) => void;
  onComplete: (response: TaskResponse) => void;
  onError: (error: Error) => void;
}

/**
 * Execute a full AI task pipeline.
 */
export async function executeTask(
  options: ExecutionOptions,
  callbacks: ExecutionCallbacks
): Promise<void> {
  const {
    recipe,
    bundleItems,
    providerId,
    model,
    temperature,
    maxTokens,
    customPrompt,
    stream = true,
  } = options;

  try {
    // Step 1: Build bundle
    callbacks.onStatusChange('building-bundle');
    const bundleContent = compileBundle(bundleItems);

    if (!bundleContent.trim()) {
      throw new Error('Bundle is empty. Select files or sections to include.');
    }

    // Step 2: Apply recipe
    callbacks.onStatusChange('applying-recipe');
    const userPrompt = customPrompt || applyRecipeTemplate(recipe, bundleContent);

    // Step 3: Resolve provider
    const effectiveProviderId = providerId || providerRegistry.getConfig().defaultProvider;
    const provider = providerRegistry.getProvider(effectiveProviderId);

    if (!provider) {
      throw new Error(`Provider not found: ${effectiveProviderId}`);
    }

    if (!providerRegistry.hasApiKey(effectiveProviderId)) {
      throw new Error(`No API key configured for ${provider.name}. Go to Settings to add one.`);
    }

    const effectiveModel = model || providerRegistry.getConfig().defaultModel;

    // Step 4: Build request
    const taskRequest: TaskRequest = {
      taskType: recipe.id,
      systemPrompt: recipe.systemPrompt,
      userPrompt,
      bundle: bundleContent,
      model: effectiveModel,
      provider: effectiveProviderId,
      temperature,
      maxTokens,
    };

    // Step 5: Call provider
    if (stream && provider.supportsStreaming()) {
      callbacks.onStatusChange('streaming');

      const streamHandlers: StreamHandlers = {
        onToken: (token) => callbacks.onToken?.(token),
        onComplete: (response) => {
          callbacks.onStatusChange('complete');
          callbacks.onComplete(response);
        },
        onError: (error) => {
          callbacks.onStatusChange('error');
          callbacks.onError(error);
        },
      };

      await provider.streamTask(taskRequest, streamHandlers);
    } else {
      callbacks.onStatusChange('calling-provider');
      const response = await provider.runTask(taskRequest);
      callbacks.onStatusChange('complete');
      callbacks.onComplete(response);
    }
  } catch (err) {
    callbacks.onStatusChange('error');
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}
