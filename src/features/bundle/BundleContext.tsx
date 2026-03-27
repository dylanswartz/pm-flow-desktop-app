/**
 * PM Flow — Bundle Context
 * State management for the bundle builder.
 */

import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import {
  type BundleItem,
  createBundleItem,
  reorderBundleItems,
  toggleBundleSection,
  compileBundle,
  computeBundleMetadata,
  formatBundleForCopy,
  type BundleMetadata,
} from '../../lib/context/bundleCompiler';
import { parseSections } from '../../lib/context/markdownParser';
import { readFileContent } from '../../lib/filesystem/fileOps';

// === Types ===

interface BundleState {
  items: BundleItem[];
  isOpen: boolean;
  preview: string;
  metadata: BundleMetadata | null;
}

type BundleAction =
  | { type: 'ADD_ITEM'; item: BundleItem }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'TOGGLE_SECTION'; itemId: string; sectionId: string }
  | { type: 'CLEAR' }
  | { type: 'SET_OPEN'; open: boolean }
  | { type: 'UPDATE_PREVIEW' };

// === Reducer ===

function bundleReducer(state: BundleState, action: BundleAction): BundleState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Don't add duplicates
      if (state.items.some(i => i.filePath === action.item.filePath)) {
        return state;
      }
      const items = [...state.items, action.item];
      return {
        ...state,
        items,
        preview: compileBundle(items),
        metadata: computeBundleMetadata(items),
      };
    }

    case 'REMOVE_ITEM': {
      const items = state.items.filter(i => i.id !== action.id);
      return {
        ...state,
        items,
        preview: compileBundle(items),
        metadata: items.length > 0 ? computeBundleMetadata(items) : null,
      };
    }

    case 'REORDER': {
      const items = reorderBundleItems(state.items, action.fromIndex, action.toIndex);
      return {
        ...state,
        items,
        preview: compileBundle(items),
        metadata: computeBundleMetadata(items),
      };
    }

    case 'TOGGLE_SECTION': {
      const items = state.items.map(item =>
        item.id === action.itemId
          ? toggleBundleSection(item, action.sectionId)
          : item
      );
      return {
        ...state,
        items,
        preview: compileBundle(items),
        metadata: computeBundleMetadata(items),
      };
    }

    case 'CLEAR':
      return {
        ...state,
        items: [],
        preview: '',
        metadata: null,
      };

    case 'SET_OPEN':
      return { ...state, isOpen: action.open };

    case 'UPDATE_PREVIEW':
      return {
        ...state,
        preview: compileBundle(state.items),
        metadata: computeBundleMetadata(state.items),
      };

    default:
      return state;
  }
}

// === Context ===

interface BundleContextValue {
  state: BundleState;
  addFile: (filePath: string) => Promise<void>;
  addFileWithContent: (filePath: string, content: string) => void;
  removeItem: (id: string) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  toggleSection: (itemId: string, sectionId: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  copyToClipboard: () => Promise<void>;
  getCompiledBundle: () => string;
}

const BundleContext = createContext<BundleContextValue | null>(null);

const initialState: BundleState = {
  items: [],
  isOpen: false,
  preview: '',
  metadata: null,
};

// === Provider ===

export function BundleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bundleReducer, initialState);

  const addFile = useCallback(async (filePath: string) => {
    try {
      const content = await readFileContent(filePath);
      const sections = parseSections(content);
      const item = createBundleItem(filePath, content, sections, state.items.length);
      dispatch({ type: 'ADD_ITEM', item });
    } catch (err) {
      console.error('Failed to add file to bundle:', err);
    }
  }, [state.items.length]);

  const addFileWithContent = useCallback((filePath: string, content: string) => {
    const sections = parseSections(content);
    const item = createBundleItem(filePath, content, sections, state.items.length);
    dispatch({ type: 'ADD_ITEM', item });
  }, [state.items.length]);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', id });
  }, []);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER', fromIndex, toIndex });
  }, []);

  const toggleSection = useCallback((itemId: string, sectionId: string) => {
    dispatch({ type: 'TOGGLE_SECTION', itemId, sectionId });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const setOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_OPEN', open });
  }, []);

  const copyToClipboard = useCallback(async () => {
    const text = formatBundleForCopy(state.items);
    await navigator.clipboard.writeText(text);
  }, [state.items]);

  const getCompiledBundle = useCallback(() => {
    return compileBundle(state.items);
  }, [state.items]);

  const value: BundleContextValue = {
    state,
    addFile,
    addFileWithContent,
    removeItem,
    reorder,
    toggleSection,
    clear,
    setOpen,
    copyToClipboard,
    getCompiledBundle,
  };

  return (
    <BundleContext.Provider value={value}>
      {children}
    </BundleContext.Provider>
  );
}

export function useBundle() {
  const ctx = useContext(BundleContext);
  if (!ctx) throw new Error('useBundle must be used within BundleProvider');
  return ctx;
}
