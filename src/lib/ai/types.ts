/**
 * PM Flow — AI Types
 * Core types for the AI execution layer.
 */

// === Provider Interface ===

export interface ProviderAdapter {
  id: string;
  name: string;
  listModels(): ModelInfo[];
  runTask(request: TaskRequest): Promise<TaskResponse>;
  streamTask(request: TaskRequest, handlers: StreamHandlers): Promise<void>;
  supportsStreaming(): boolean;
  supportsCaching(): boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  supportsStreaming: boolean;
}

// === Task Request/Response ===

export interface TaskRequest {
  taskType: string;
  systemPrompt: string;
  userPrompt: string;
  bundle: string;
  model: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}

export interface TaskResponse {
  content: string;
  model: string;
  provider: string;
  inputTokens?: number;
  outputTokens?: number;
  stopReason?: string;
  duration?: number;
}

// === Streaming ===

export interface StreamHandlers {
  onToken: (token: string) => void;
  onComplete: (response: TaskResponse) => void;
  onError: (error: Error) => void;
}

// === Task Recipes ===

export interface TaskRecipe {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  outputFormat?: string;
  constraints?: string[];
  defaultModel?: string;
}

// === Output Modes ===

export type OutputMode =
  | 'preview'       // Show only, don't save
  | 'new-file'      // Create new file in workspace
  | 'append'        // Append to existing file
  | 'replace'       // Replace section in file
  | 'iteration-log' // Append to iteration log

export interface OutputTarget {
  mode: OutputMode;
  filePath?: string;       // For append / replace
  sectionId?: string;      // For replace
  newFileName?: string;    // For new-file
}

// === Configuration ===

export interface ProviderConfig {
  id: string;
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  enabled: boolean;
}

export interface AiConfig {
  providers: ProviderConfig[];
  defaultProvider: string;
  defaultModel: string;
}

// === Execution State ===

export type ExecutionStatus =
  | 'idle'
  | 'building-bundle'
  | 'applying-recipe'
  | 'calling-provider'
  | 'streaming'
  | 'complete'
  | 'error'
  | 'cancelled';

export interface ExecutionState {
  status: ExecutionStatus;
  currentResponse: string;
  error?: string;
  taskRequest?: TaskRequest;
  taskResponse?: TaskResponse;
}
