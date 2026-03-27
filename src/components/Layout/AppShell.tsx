/**
 * PM Flow — App Shell
 * Main application layout: sidebar | editor | right panel
 */

import { useState, useCallback, useEffect } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { useBundle } from '../../features/bundle/BundleContext';
import { FileTree } from '../../components/FileTree/FileTree';
import { Editor } from '../../components/Editor/Editor';
import { BundleBuilder } from '../BundleBuilder/BundleBuilder';
import { AiPanel } from '../AiPanel/AiPanel';
import { NewFileModal } from '../Modals/NewFileModal';
import { NewFolderModal } from '../Modals/NewFolderModal';
import { SettingsModal } from '../Modals/SettingsModal';
import { searchFiles, type SearchResult } from '../../lib/search/search';
import './Layout.css';

// === Icons ===

const FolderOpenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M14 7.5V5.5C14 4.95 13.55 4.5 13 4.5H8L6.5 3H3.5C2.95 3 2.5 3.45 2.5 4V12.5C2.5 13.05 2.95 13.5 3.5 13.5H12L14.5 8.5H4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 7C1 3.69 3.69 1 7 1C9.22 1 11.12 2.22 12 4M13 7C13 10.31 10.31 13 7 13C4.78 13 2.88 11.78 2 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M12 1V4H9M2 13V10H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const FolderPlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M12 6.5V4.5C12 3.95 11.55 3.5 11 3.5H6.5L5 2H2.5C1.95 2 1.5 2.45 1.5 3V10.5C1.5 11.05 1.95 11.5 2.5 11.5H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 9V13M8 11H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const GearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M7 1V2M7 12V13M1 7H2M12 7H13M2.5 2.5L3.5 3.5M10.5 10.5L11.5 11.5M11.5 2.5L10.5 3.5M3.5 10.5L2.5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const BundleBoxIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M2 6H12M6 6V11" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const AiIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1L8.5 5.5L13 7L8.5 8.5L7 13L5.5 8.5L1 7L5.5 5.5L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type RightPanelView = 'bundle' | 'ai';

// === Search Results ===

function SearchResults({ results, onFileClick, onClose }: {
  results: SearchResult[];
  onFileClick: (path: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="search-results">
      <div className="search-results-header">
        <span className="text-sm font-medium">
          {results.length} file{results.length !== 1 ? 's' : ''} found
        </span>
        <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="search-results-list">
        {results.map(result => (
          <div
            key={result.filePath}
            className="search-result-item"
            onClick={() => { onFileClick(result.filePath); onClose(); }}
          >
            <span className="text-sm font-medium text-accent">{result.fileName}</span>
            <span className="text-xs text-tertiary">{result.totalMatches} match{result.totalMatches !== 1 ? 'es' : ''}</span>
            {result.matches.slice(0, 2).map((match: {lineNumber: number; lineContent: string}, i: number) => (
              <p key={i} className="text-xs text-secondary search-match-line">
                <span className="text-tertiary">L{match.lineNumber}: </span>
                {match.lineContent.substring(0, 80)}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// === Welcome Screen ===

function WelcomeScreen() {
  const { selectWorkspace } = useWorkspace();

  return (
    <div className="welcome-screen">
      <div className="welcome-content animate-slideUp">
        <div className="welcome-logo">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="64" y2="64">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <rect x="8" y="8" width="48" height="48" rx="12" fill="url(#logo-grad)" opacity="0.15" />
            <path d="M32 16L35 26L45 29L35 32L32 42L29 32L19 29L29 26L32 16Z" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 20L22 24L26 25.5L22 27L20 31L18 27L14 25.5L18 24L20 20Z" stroke="url(#logo-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            <path d="M44 36L45.5 39L49 40.5L45.5 42L44 45L42.5 42L39 40.5L42.5 39L44 36Z" stroke="url(#logo-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          </svg>
        </div>
        <h1 className="welcome-title">PM Flow</h1>
        <p className="welcome-subtitle">
          Context Operating System for AI-Native Product Management
        </p>
        <p className="welcome-description">
          Structure your thinking. Build context bundles. Execute AI tasks. Iterate faster.
        </p>
        <button
          className="btn btn-lg btn-primary welcome-cta"
          onClick={selectWorkspace}
          id="open-workspace-button"
        >
          <FolderOpenIcon />
          Open Workspace
        </button>
        <p className="text-xs text-tertiary" style={{ marginTop: 'var(--space-3)' }}>
          Select a folder containing your markdown context files
        </p>
      </div>
    </div>
  );
}

// === App Shell ===

export function AppShell() {
  const { state, selectWorkspace, refreshFileTree, openFile } = useWorkspace();
  const { state: bundleState } = useBundle();
  const [rightPanel, setRightPanel] = useState<RightPanelView>('ai');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [, setIsSearching] = useState(false);

  // Modal State
  const [showNewFile, setShowNewFile] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Keyboard shortcut: Ctrl+O to open workspace
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        selectWorkspace();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectWorkspace]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !state.workspacePath) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchFiles(state.workspacePath, query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
    setIsSearching(false);
  }, [state.workspacePath]);

  const handleNewFile = useCallback(() => setShowNewFile(true), []);
  const handleNewFolder = useCallback(() => setShowNewFolder(true), []);

  // No workspace selected
  if (!state.workspacePath) {
    return <WelcomeScreen />;
  }

  return (
    <div className="app-shell" id="app-shell">
      {/* Sidebar */}
      <aside className="sidebar" id="sidebar">
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L10.5 6.5L15 8L10.5 9.5L9 14L7.5 9.5L3 8L7.5 6.5L9 2Z" stroke="url(#logo-grad-small)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="logo-grad-small" x1="3" y1="2" x2="15" y2="14">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="sidebar-title font-semibold">PM Flow</span>
          </div>
          <div className="sidebar-actions">
            <button
              className="btn btn-icon btn-ghost tooltip"
              data-tooltip="New file"
              onClick={handleNewFile}
              aria-label="New file"
            >
              <PlusIcon />
            </button>
            <button
              className="btn btn-icon btn-ghost tooltip"
              data-tooltip="New folder"
              onClick={handleNewFolder}
              aria-label="New folder"
            >
              <FolderPlusIcon />
            </button>
            <button
              className="btn btn-icon btn-ghost tooltip"
              data-tooltip="Refresh"
              onClick={refreshFileTree}
              aria-label="Refresh file tree"
            >
              <RefreshIcon />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <div className="sidebar-search-input-wrapper">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="sidebar-search-input"
              id="search-input"
            />
          </div>
        </div>

        {/* Search Results or File Tree */}
        {searchResults ? (
          <SearchResults
            results={searchResults}
            onFileClick={openFile}
            onClose={() => { setSearchQuery(''); setSearchResults(null); }}
          />
        ) : (
          <FileTree />
        )}

        {/* Sidebar Footer */}
        <div className="sidebar-footer" style={{ display: 'flex', gap: '4px' }}>
          <button
            className="btn btn-sm btn-ghost"
            onClick={selectWorkspace}
            style={{ flex: 1, justifyContent: 'flex-start' }}
            title="Switch Workspace"
          >
            <FolderOpenIcon />
            <span className="truncate text-xs">{state.workspacePath.split('/').pop()}</span>
          </button>
          <button
            className="btn btn-icon btn-ghost tooltip"
            data-tooltip="Settings"
            onClick={() => setShowSettings(true)}
          >
            <GearIcon />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Editor />
      </main>

      {/* Right Panel */}
      <aside className="right-panel" id="right-panel">
        {/* Panel Tab Switcher */}
        <div className="right-panel-tabs">
          <button
            className={`right-panel-tab ${rightPanel === 'bundle' ? 'active' : ''}`}
            onClick={() => setRightPanel('bundle')}
          >
            <BundleBoxIcon />
            <span>Bundle</span>
            {bundleState.items.length > 0 && (
              <span className="badge badge-accent" style={{ fontSize: '9px', padding: '0 4px' }}>
                {bundleState.items.length}
              </span>
            )}
          </button>
          <button
            className={`right-panel-tab ${rightPanel === 'ai' ? 'active' : ''}`}
            onClick={() => setRightPanel('ai')}
          >
            <AiIcon />
            <span>AI</span>
          </button>
        </div>

        {/* Panel Content */}
        <div className="right-panel-content">
          {rightPanel === 'bundle' ? <BundleBuilder /> : <AiPanel />}
        </div>
      </aside>

      {/* Modals */}
      {showNewFile && <NewFileModal onClose={() => setShowNewFile(false)} />}
      {showNewFolder && <NewFolderModal onClose={() => setShowNewFolder(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
