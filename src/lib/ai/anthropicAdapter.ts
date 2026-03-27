/**
 * PM Flow — Anthropic Adapter
 * First-class provider adapter for Anthropic's Claude API.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import {
  type ProviderAdapter,
  type ModelInfo,
  type TaskRequest,
  type TaskResponse,
  type StreamHandlers,
} from './types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

interface HttpRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

interface HttpResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
}

export class AnthropicAdapter implements ProviderAdapter {
  id = 'anthropic';
  name = 'Anthropic';

  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  listModels(): ModelInfo[] {
    return [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        contextWindow: 200000,
        maxOutput: 64000,
        supportsStreaming: true,
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        contextWindow: 200000,
        maxOutput: 8192,
        supportsStreaming: true,
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        maxOutput: 8192,
        supportsStreaming: true,
      },
    ];
  }

  supportsStreaming(): boolean {
    return true;
  }

  supportsCaching(): boolean {
    return true;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    };
  }

  /**
   * Run a task synchronously (non-streaming).
   */
  async runTask(request: TaskRequest): Promise<TaskResponse> {
    const startTime = Date.now();

    const body = {
      model: request.model,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0.7,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.userPrompt,
        },
      ],
    };

    const httpRequest: HttpRequest = {
      url: ANTHROPIC_API_URL,
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    };

    const response = await invoke<HttpResponse>('http_request', { request: httpRequest });

    if (response.status !== 200) {
      throw new Error(`Anthropic API error (${response.status}): ${response.body}`);
    }

    const data = JSON.parse(response.body);
    const duration = Date.now() - startTime;

    return {
      content: data.content?.[0]?.text || '',
      model: data.model,
      provider: 'anthropic',
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens,
      stopReason: data.stop_reason,
      duration,
    };
  }

  /**
   * Run a task with streaming response.
   */
  async streamTask(request: TaskRequest, handlers: StreamHandlers): Promise<void> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const startTime = Date.now();
    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let model = request.model;

    const body = {
      model: request.model,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0.7,
      stream: true,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.userPrompt,
        },
      ],
    };

    const httpRequest: HttpRequest = {
      url: ANTHROPIC_API_URL,
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    };

    // Set up event listeners for streaming
    const unlisteners: UnlistenFn[] = [];

    const chunkPromise = new Promise<void>((resolve, reject) => {
      // Listen for stream chunks
      listen<string>(`stream-chunk-${requestId}`, (event) => {
        const chunk = event.payload;

        // Anthropic SSE format: parse "data: {...}" lines
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.substring(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);

            // Handle different event types
            if (data.type === 'message_start' && data.message) {
              model = data.message.model || model;
              if (data.message.usage) {
                inputTokens = data.message.usage.input_tokens || 0;
              }
            } else if (data.type === 'content_block_delta' && data.delta?.text) {
              fullContent += data.delta.text;
              handlers.onToken(data.delta.text);
            } else if (data.type === 'message_delta' && data.usage) {
              outputTokens = data.usage.output_tokens || 0;
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }).then(fn => unlisteners.push(fn));

      // Listen for stream errors
      listen<string>(`stream-error-${requestId}`, (event) => {
        reject(new Error(event.payload));
      }).then(fn => unlisteners.push(fn));

      // Listen for stream completion
      listen(`stream-done-${requestId}`, () => {
        resolve();
      }).then(fn => unlisteners.push(fn));
    });

    // Start the streaming request via Tauri backend
    try {
      // Small delay to ensure listeners are set up
      await new Promise(r => setTimeout(r, 50));

      invoke('http_stream_request', {
        requestId,
        request: httpRequest,
      });

      await chunkPromise;

      const duration = Date.now() - startTime;
      handlers.onComplete({
        content: fullContent,
        model,
        provider: 'anthropic',
        inputTokens,
        outputTokens,
        duration,
      });
    } catch (err) {
      handlers.onError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      // Clean up listeners
      for (const unlisten of unlisteners) {
        unlisten();
      }
    }
  }
}
