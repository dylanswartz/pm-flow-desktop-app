/**
 * PM Flow — Workspace Context
 * Global state for workspace, open files, and active file.
 */

import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react';
import { type FileNode } from '../../lib/filesystem/fileOps';
import {
  selectWorkspaceFolder,
  readDirectoryTree,
  readFileContent,
  writeFileContent,
} from '../../lib/filesystem/fileOps';
import { parseFrontmatter, type Frontmatter } from '../../lib/context/frontmatterParser';
import { parseSections, type MarkdownSection } from '../../lib/context/markdownParser';

// === Types ===

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  frontmatter: Frontmatter;
  sections: MarkdownSection[];
  isDirty: boolean;
}

interface WorkspaceState {
  workspacePath: string | null;
  fileTree: FileNode[];
  openFiles: OpenFile[];
  activeFilePath: string | null;
  isLoading: boolean;
  error: string | null;
}

type WorkspaceAction =
  | { type: 'SET_WORKSPACE'; path: string; tree: FileNode[] }
  | { type: 'SET_FILE_TREE'; tree: FileNode[] }
  | { type: 'OPEN_FILE'; file: OpenFile }
  | { type: 'CLOSE_FILE'; path: string }
  | { type: 'SET_ACTIVE_FILE'; path: string }
  | { type: 'UPDATE_FILE_CONTENT'; path: string; content: string }
  | { type: 'MARK_FILE_SAVED'; path: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLOSE_WORKSPACE' };

// === Reducer ===

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'SET_WORKSPACE':
      return {
        ...state,
        workspacePath: action.path,
        fileTree: action.tree,
        openFiles: [],
        activeFilePath: null,
        isLoading: false,
        error: null,
      };

    case 'SET_FILE_TREE':
      return { ...state, fileTree: action.tree };

    case 'OPEN_FILE': {
      const existing = state.openFiles.find(f => f.path === action.file.path);
      if (existing) {
        return { ...state, activeFilePath: action.file.path };
      }
      return {
        ...state,
        openFiles: [...state.openFiles, action.file],
        activeFilePath: action.file.path,
      };
    }

    case 'CLOSE_FILE': {
      const newFiles = state.openFiles.filter(f => f.path !== action.path);
      let newActive = state.activeFilePath;
      if (state.activeFilePath === action.path) {
        newActive = newFiles.length > 0 ? newFiles[newFiles.length - 1].path : null;
      }
      return { ...state, openFiles: newFiles, activeFilePath: newActive };
    }

    case 'SET_ACTIVE_FILE':
      return { ...state, activeFilePath: action.path };

    case 'UPDATE_FILE_CONTENT': {
      return {
        ...state,
        openFiles: state.openFiles.map(f => {
          if (f.path !== action.path) return f;
          const parsed = parseFrontmatter(action.content);
          const sections = parseSections(parsed.content);
          return {
            ...f,
            content: action.content,
            frontmatter: parsed.frontmatter,
            sections,
            isDirty: action.content !== f.originalContent,
          };
        }),
      };
    }

    case 'MARK_FILE_SAVED':
      return {
        ...state,
        openFiles: state.openFiles.map(f =>
          f.path === action.path
            ? { ...f, originalContent: f.content, isDirty: false }
            : f
        ),
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'CLOSE_WORKSPACE':
      return {
        workspacePath: null,
        fileTree: [],
        openFiles: [],
        activeFilePath: null,
        isLoading: false,
        error: null,
      };

    default:
      return state;
  }
}

// === Context ===

interface WorkspaceContextValue {
  state: WorkspaceState;
  selectWorkspace: () => Promise<void>;
  refreshFileTree: () => Promise<void>;
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;
  saveActiveFile: () => Promise<void>;
  createFile: (dirPath: string, name: string, content?: string) => Promise<void>;
  createDirectory: (dirPath: string, name: string) => Promise<void>;
  closeWorkspace: () => void;
  getActiveFile: () => OpenFile | undefined;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const initialState: WorkspaceState = {
  workspacePath: null,
  fileTree: [],
  openFiles: [],
  activeFilePath: null,
  isLoading: false,
  error: null,
};

// === Provider ===

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  // Restore last workspace on mount
  useEffect(() => {
    const lastWorkspace = localStorage.getItem('pmflow-last-workspace');
    if (lastWorkspace) {
      loadWorkspace(lastWorkspace);
    }
  }, []);

  const loadWorkspace = useCallback(async (path: string) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const tree = await readDirectoryTree(path);
      dispatch({ type: 'SET_WORKSPACE', path, tree });
      localStorage.setItem('pmflow-last-workspace', path);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: `Failed to load workspace: ${err}` });
    }
  }, []);

  const selectWorkspace = useCallback(async () => {
    const path = await selectWorkspaceFolder();
    if (path) {
      await loadWorkspace(path);
    }
  }, [loadWorkspace]);

  const refreshFileTree = useCallback(async () => {
    if (!state.workspacePath) return;
    try {
      const tree = await readDirectoryTree(state.workspacePath);
      dispatch({ type: 'SET_FILE_TREE', tree });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: `Failed to refresh: ${err}` });
    }
  }, [state.workspacePath]);

  const openFile = useCallback(async (path: string) => {
    // Check if already open
    const existing = state.openFiles.find(f => f.path === path);
    if (existing) {
      dispatch({ type: 'SET_ACTIVE_FILE', path });
      return;
    }

    try {
      const raw = await readFileContent(path);
      const parsed = parseFrontmatter(raw);
      const sections = parseSections(parsed.content);
      const name = path.split('/').pop() || path;

      const file: OpenFile = {
        path,
        name,
        content: raw,
        originalContent: raw,
        frontmatter: parsed.frontmatter,
        sections,
        isDirty: false,
      };

      dispatch({ type: 'OPEN_FILE', file });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: `Failed to open file: ${err}` });
    }
  }, [state.openFiles]);

  const closeFile = useCallback((path: string) => {
    dispatch({ type: 'CLOSE_FILE', path });
  }, []);

  const setActiveFile = useCallback((path: string) => {
    dispatch({ type: 'SET_ACTIVE_FILE', path });
  }, []);

  const updateFileContent = useCallback((path: string, content: string) => {
    dispatch({ type: 'UPDATE_FILE_CONTENT', path, content });
  }, []);

  const saveFile = useCallback(async (path: string) => {
    const file = state.openFiles.find(f => f.path === path);
    if (!file || !file.isDirty) return;

    try {
      await writeFileContent(path, file.content);
      dispatch({ type: 'MARK_FILE_SAVED', path });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: `Failed to save: ${err}` });
    }
  }, [state.openFiles]);

  const saveActiveFile = useCallback(async () => {
    if (state.activeFilePath) {
      await saveFile(state.activeFilePath);
    }
  }, [state.activeFilePath, saveFile]);

  const createFile = useCallback(async (dirPath: string, name: string, content?: string) => {
    const filePath = `${dirPath}/${name}`;
    const defaultContent = content || '';

    try {
      await writeFileContent(filePath, defaultContent);
      await refreshFileTree();
      await openFile(filePath);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: `Failed to create file: ${err}` });
    }
  }, [refreshFileTree, openFile]);

  const createDirectory = useCallback(async (dirPath: string, name: string) => {
    const fullPath = `${dirPath}/${name}`;
    try {
      const { createDirectory: fsCreateDirectory } = await import('../../lib/filesystem/fileOps');
      await fsCreateDirectory(fullPath);
      await refreshFileTree();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: `Failed to create folder: ${err}` });
    }
  }, [refreshFileTree]);

  const closeWorkspace = useCallback(() => {
    localStorage.removeItem('pmflow-last-workspace');
    dispatch({ type: 'CLOSE_WORKSPACE' });
  }, []);

  const getActiveFile = useCallback(() => {
    return state.openFiles.find(f => f.path === state.activeFilePath);
  }, [state.openFiles, state.activeFilePath]);

  const value: WorkspaceContextValue = {
    state,
    selectWorkspace,
    refreshFileTree,
    openFile,
    closeFile,
    setActiveFile,
    updateFileContent,
    saveFile,
    saveActiveFile,
    createFile,
    createDirectory,
    closeWorkspace,
    getActiveFile,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
