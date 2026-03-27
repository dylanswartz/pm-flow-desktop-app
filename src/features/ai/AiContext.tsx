/**
 * PM Flow — AI Context
 * State management for AI execution flow.
 */

import { createContext, useContext, useReducer, useCallback, useRef, type ReactNode } from 'react';
import {
  type ExecutionStatus,
  type TaskResponse,
  type TaskRecipe,
  type OutputMode,
} from '../../lib/ai/types';
import { executeTask, type ExecutionOptions } from '../../lib/ai/executionEngine';
import { type BundleItem } from '../../lib/context/bundleCompiler';

// === Types ===

interface AiState {
  status: ExecutionStatus;
  currentResponse: string;
  error: string | null;
  lastResponse: TaskResponse | null;
  isModalOpen: boolean;
  selectedRecipeId: string;
  selectedModel: string;
  selectedProvider: string;
  outputMode: OutputMode;
  customPrompt: string;
}

type AiAction =
  | { type: 'SET_STATUS'; status: ExecutionStatus }
  | { type: 'APPEND_TOKEN'; token: string }
  | { type: 'SET_RESPONSE'; response: TaskResponse }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' }
  | { type: 'SET_MODAL_OPEN'; open: boolean }
  | { type: 'SET_RECIPE'; recipeId: string }
  | { type: 'SET_MODEL'; model: string }
  | { type: 'SET_PROVIDER'; provider: string }
  | { type: 'SET_OUTPUT_MODE'; mode: OutputMode }
  | { type: 'SET_CUSTOM_PROMPT'; prompt: string }
  | { type: 'CLEAR_RESPONSE' };

// === Reducer ===

function aiReducer(state: AiState, action: AiAction): AiState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.status, error: null };

    case 'APPEND_TOKEN':
      return { ...state, currentResponse: state.currentResponse + action.token };

    case 'SET_RESPONSE':
      return {
        ...state,
        lastResponse: action.response,
        currentResponse: action.response.content,
        status: 'complete',
      };

    case 'SET_ERROR':
      return { ...state, error: action.error, status: 'error' };

    case 'RESET':
      return {
        ...state,
        status: 'idle',
        currentResponse: '',
        error: null,
        lastResponse: null,
      };

    case 'SET_MODAL_OPEN':
      return { ...state, isModalOpen: action.open };

    case 'SET_RECIPE':
      return { ...state, selectedRecipeId: action.recipeId };

    case 'SET_MODEL':
      return { ...state, selectedModel: action.model };

    case 'SET_PROVIDER':
      return { ...state, selectedProvider: action.provider };

    case 'SET_OUTPUT_MODE':
      return { ...state, outputMode: action.mode };

    case 'SET_CUSTOM_PROMPT':
      return { ...state, customPrompt: action.prompt };

    case 'CLEAR_RESPONSE':
      return { ...state, currentResponse: '', lastResponse: null, status: 'idle', error: null };

    default:
      return state;
  }
}

// === Context ===

interface AiContextValue {
  state: AiState;
  runTask: (recipe: TaskRecipe, bundleItems: BundleItem[]) => Promise<void>;
  cancelTask: () => void;
  setModalOpen: (open: boolean) => void;
  setRecipe: (id: string) => void;
  setModel: (model: string) => void;
  setProvider: (provider: string) => void;
  setOutputMode: (mode: OutputMode) => void;
  setCustomPrompt: (prompt: string) => void;
  reset: () => void;
  clearResponse: () => void;
}

const AiContext = createContext<AiContextValue | null>(null);

const initialState: AiState = {
  status: 'idle',
  currentResponse: '',
  error: null,
  lastResponse: null,
  isModalOpen: false,
  selectedRecipeId: 'refine-context',
  selectedModel: 'claude-sonnet-4-20250514',
  selectedProvider: 'anthropic',
  outputMode: 'preview',
  customPrompt: '',
};

// === Provider ===

export function AiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(aiReducer, initialState);
  const abortRef = useRef(false);

  const runTask = useCallback(async (recipe: TaskRecipe, bundleItems: BundleItem[]) => {
    abortRef.current = false;
    dispatch({ type: 'RESET' });

    const options: ExecutionOptions = {
      recipe,
      bundleItems,
      providerId: state.selectedProvider,
      model: state.selectedModel,
      customPrompt: state.customPrompt || undefined,
      stream: true,
    };

    await executeTask(options, {
      onStatusChange: (status) => {
        if (!abortRef.current) {
          dispatch({ type: 'SET_STATUS', status });
        }
      },
      onToken: (token) => {
        if (!abortRef.current) {
          dispatch({ type: 'APPEND_TOKEN', token });
        }
      },
      onComplete: (response) => {
        if (!abortRef.current) {
          dispatch({ type: 'SET_RESPONSE', response });
        }
      },
      onError: (error) => {
        if (!abortRef.current) {
          dispatch({ type: 'SET_ERROR', error: error.message });
        }
      },
    });
  }, [state.selectedProvider, state.selectedModel, state.customPrompt]);

  const cancelTask = useCallback(() => {
    abortRef.current = true;
    dispatch({ type: 'SET_STATUS', status: 'cancelled' });
  }, []);

  const setModalOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_MODAL_OPEN', open });
  }, []);

  const setRecipe = useCallback((id: string) => {
    dispatch({ type: 'SET_RECIPE', recipeId: id });
  }, []);

  const setModel = useCallback((model: string) => {
    dispatch({ type: 'SET_MODEL', model });
  }, []);

  const setProvider = useCallback((provider: string) => {
    dispatch({ type: 'SET_PROVIDER', provider });
  }, []);

  const setOutputMode = useCallback((mode: OutputMode) => {
    dispatch({ type: 'SET_OUTPUT_MODE', mode });
  }, []);

  const setCustomPrompt = useCallback((prompt: string) => {
    dispatch({ type: 'SET_CUSTOM_PROMPT', prompt });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const clearResponse = useCallback(() => {
    dispatch({ type: 'CLEAR_RESPONSE' });
  }, []);

  const value: AiContextValue = {
    state,
    runTask,
    cancelTask,
    setModalOpen,
    setRecipe,
    setModel,
    setProvider,
    setOutputMode,
    setCustomPrompt,
    reset,
    clearResponse,
  };

  return (
    <AiContext.Provider value={value}>
      {children}
    </AiContext.Provider>
  );
}

export function useAi() {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error('useAi must be used within AiProvider');
  return ctx;
}
