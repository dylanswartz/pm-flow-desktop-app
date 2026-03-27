/**
 * PM Flow — App Shell
 * Main application layout: sidebar | editor | right panel
 */

import { useState, useCallback, useEffect } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { useBundle } from '../../features/bundle/BundleContext';
import { Titlebar } from './Titlebar';
import { FileTree } from '../../components/FileTree/FileTree';
import { Editor } from '../../components/Editor/Editor';
import { BundleBuilder } from '../BundleBuilder/BundleBuilder';
import { AiPanel } from '../AiPanel/AiPanel';
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



const GearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2a2 2 0 0 1-2 2a2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2a2 2 0 0 1 2 2a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2a2 2 0 0 1 2-2a2 2 0 0 0 2-2V7.78a2 2 0 0 0-2-2a2 2 0 0 1-2-2a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
);

const LogOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
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
            {result.matches.slice(0, 2).map((match: { lineNumber: number; lineContent: string }, i: number) => (
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

// === App Shell ===

export function AppShell() {
  const { state, selectWorkspace, openFile, closeWorkspace } = useWorkspace();
  const { state: bundleState } = useBundle();
  const [rightPanel, setRightPanel] = useState<RightPanelView>('ai');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [, setIsSearching] = useState(false);

  // Modal State
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


  return (
    <>
      <Titlebar />
      <div className="app-shell" id="app-shell">
        {/* Sidebar */}
        <aside className="sidebar" id="sidebar">

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
              <span className="truncate text-xs">
                {state.workspacePath ? state.workspacePath.split('/').pop() : 'Open Workspace'}
              </span>
            </button>
            <button
              className="btn btn-icon btn-ghost tooltip"
              data-tooltip="Settings"
              onClick={() => setShowSettings(true)}
            >
              <GearIcon />
            </button>
            {state.workspacePath && (
              <button
                className="btn btn-icon btn-ghost tooltip"
                data-tooltip="Close Workspace"
                onClick={closeWorkspace}
              >
                <LogOutIcon />
              </button>
            )}
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
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    </>
  );
}
