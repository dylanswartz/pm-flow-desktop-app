/**
 * PM Flow — Bundle Builder Component
 * Select files, pick sections, reorder, preview, and copy bundles.
 */

import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBundle } from '../../features/bundle/BundleContext';
import { flattenSections } from '../../lib/context/markdownParser';
import './BundleBuilder.css';

// === Icons ===

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 3H10M4.5 3V2C4.5 1.45 4.95 1 5.5 1H6.5C7.05 1 7.5 1.45 7.5 2V3M3 3V10C3 10.55 3.45 11 4 11H8C8.55 11 9 10.55 9 10V3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M5 1.5V8.5M5 1.5L2 4.5M5 1.5L8 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M5 8.5V1.5M5 8.5L2 5.5M5 8.5L8 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="4.5" y="4.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M9.5 4.5V2.5C9.5 1.95 9.05 1.5 8.5 1.5H2.5C1.95 1.5 1.5 1.95 1.5 2.5V8.5C1.5 9.05 1.95 9.5 2.5 9.5H4.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// === Bundle Builder ===

export function BundleBuilder() {
  const { state, removeItem, reorder, toggleSection, clear, copyToClipboard } = useBundle();
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCopy = useCallback(async () => {
    await copyToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [copyToClipboard]);

  const handleMoveUp = useCallback((index: number) => {
    if (index > 0) reorder(index, index - 1);
  }, [reorder]);

  const handleMoveDown = useCallback((index: number) => {
    if (index < state.items.length - 1) reorder(index, index + 1);
  }, [reorder, state.items.length]);

  if (state.items.length === 0) {
    return (
      <div className="bundle-empty">
        <div className="bundle-empty-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="6" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
            <path d="M4 12H28M12 12V26" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
          </svg>
        </div>
        <p className="text-sm text-secondary">No files in bundle</p>
        <p className="text-xs text-tertiary">Click the ≡ icon next to files in the sidebar to add them</p>
      </div>
    );
  }

  return (
    <div className="bundle-builder" id="bundle-builder">
      {/* Header */}
      <div className="bundle-header">
        <div className="bundle-header-info">
          <span className="badge badge-accent">{state.items.length} files</span>
          {state.metadata && (
            <span className="text-xs text-tertiary">
              ~{state.metadata.estimatedTokens.toLocaleString()} tokens
            </span>
          )}
        </div>
        <div className="bundle-header-actions">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'List' : 'Preview'}
          </button>
          <button
            className={`btn btn-sm ${copied ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleCopy}
          >
            {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
          </button>
          <button className="btn btn-sm btn-ghost btn-danger" onClick={clear}>
            Clear
          </button>
        </div>
      </div>

      {/* Content */}
      {showPreview ? (
        <div className="bundle-preview">
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {state.preview}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="bundle-item-list">
          {state.items.map((item, index) => (
            <div key={item.id} className="bundle-item" id={`bundle-item-${index}`}>
              <div className="bundle-item-header">
                <div className="bundle-item-name">
                  <span className="text-sm font-medium">{item.fileName}</span>
                </div>
                <div className="bundle-item-actions">
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <ArrowUpIcon />
                  </button>
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === state.items.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDownIcon />
                  </button>
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove from bundle"
                    style={{ color: 'var(--color-error)' }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {/* Section Selection */}
              {item.sections.length > 0 && (
                <div className="bundle-item-sections">
                  {flattenSections(item.sections).map(section => (
                    <label
                      key={section.id}
                      className="bundle-section-check"
                      style={{ paddingLeft: `${(section.level) * 12}px` }}
                    >
                      <input
                        type="checkbox"
                        checked={item.selectedSections.length === 0 || item.selectedSections.includes(section.id)}
                        onChange={() => toggleSection(item.id, section.id)}
                      />
                      <span className="text-xs">{section.heading}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
