/**
 * PM Flow — Editor Component
 * Split view: markdown edit + live preview with tab bar.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWorkspace, type OpenFile, WELCOME_TAB_ID } from '../../features/workspace/WorkspaceContext';
import { WelcomeTab } from './WelcomeTab';
import './Editor.css';

// === Icons ===

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9.5 1.5L12.5 4.5M1 13H4L12 5L9 2L1 10V13Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PreviewIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 7C1 7 3.5 2 7 2C10.5 2 13 7 13 7C13 7 10.5 12 7 12C3.5 12 1 7 1 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const SplitIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

// === Tab Bar ===

function TabBar() {
  const { state, setActiveFile, closeFile } = useWorkspace();

  return (
    <div className="editor-tab-bar" id="editor-tab-bar">
      {state.openFiles.map(file => (
        <div
          key={file.path}
          className={`editor-tab ${file.path === state.activeFilePath ? 'active' : ''}`}
          onClick={() => setActiveFile(file.path)}
          id={`tab-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
        >
          <span className="editor-tab-name">
            {file.isDirty && <span className="editor-tab-dirty">●</span>}
            {file.name}
          </span>
          <button
            className="editor-tab-close"
            onClick={(e) => { e.stopPropagation(); closeFile(file.path); }}
            aria-label={`Close ${file.name}`}
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
}

// === Frontmatter Display ===

function FrontmatterBadges({ file }: { file: OpenFile }) {
  const fm = file.frontmatter;
  if (!fm || Object.keys(fm).length === 0) return null;

  return (
    <div className="editor-frontmatter">
      {fm.title && <span className="badge badge-accent">{fm.title}</span>}
      {fm.type && <span className="badge badge-success">{fm.type}</span>}
      {fm.domain && <span className="badge badge-warning">{fm.domain}</span>}
      {fm.tags && Array.isArray(fm.tags) && fm.tags.map(tag => (
        <span key={tag} className="badge" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}>
          {tag}
        </span>
      ))}
    </div>
  );
}

// === Editor ===

type ViewMode = 'split' | 'edit' | 'preview';

export function Editor() {
  const { state, updateFileContent, saveActiveFile, getActiveFile, openWelcomeTab } = useWorkspace();
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = getActiveFile();

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveActiveFile();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveActiveFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeFile) {
      updateFileContent(activeFile.path, e.target.value);
    }
  }, [activeFile, updateFileContent]);

  // No files open
  if (state.openFiles.length === 0) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-content">
          <div className="editor-empty-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M28 4H12C9.79 4 8 5.79 8 8V40C8 42.21 9.79 44 12 44H36C38.21 44 40 42.21 40 40V16L28 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
              <path d="M28 4V16H40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
              <path d="M16 26H32M16 32H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
            </svg>
          </div>
          <p className="text-secondary">Select a file from the sidebar to start editing</p>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={openWelcomeTab}>
              Getting Started / Welcome
            </button>
            <p className="text-xs text-tertiary">
              Or use Ctrl+O to open a workspace
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor" id="editor">
      <TabBar />

      {activeFile?.path === WELCOME_TAB_ID && <WelcomeTab />}

      {activeFile && activeFile.path !== WELCOME_TAB_ID && (
        <>
          {/* Toolbar */}
          <div className="editor-toolbar">
            <FrontmatterBadges file={activeFile} />
            <div className="editor-toolbar-right">
              {activeFile.isDirty && (
                <button className="btn btn-sm btn-primary" onClick={saveActiveFile}>
                  Save
                </button>
              )}
              <div className="editor-view-toggle">
                <button
                  className={`btn btn-icon btn-ghost ${viewMode === 'edit' ? 'active' : ''}`}
                  onClick={() => setViewMode('edit')}
                  title="Edit mode"
                  aria-label="Edit mode"
                >
                  <EditIcon />
                </button>
                <button
                  className={`btn btn-icon btn-ghost ${viewMode === 'split' ? 'active' : ''}`}
                  onClick={() => setViewMode('split')}
                  title="Split view"
                  aria-label="Split view"
                >
                  <SplitIcon />
                </button>
                <button
                  className={`btn btn-icon btn-ghost ${viewMode === 'preview' ? 'active' : ''}`}
                  onClick={() => setViewMode('preview')}
                  title="Preview mode"
                  aria-label="Preview mode"
                >
                  <PreviewIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className={`editor-content editor-content--${viewMode}`}>
            {viewMode !== 'preview' && (
              <div className="editor-pane editor-pane--edit">
                <textarea
                  ref={textareaRef}
                  className="editor-textarea"
                  value={activeFile.content}
                  onChange={handleChange}
                  spellCheck={false}
                  wrap="off"
                  aria-label="Markdown editor"
                  id="markdown-editor-textarea"
                />
              </div>
            )}
            {viewMode !== 'edit' && (
              <div className="editor-pane editor-pane--preview">
                <div className="markdown-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeFile.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
