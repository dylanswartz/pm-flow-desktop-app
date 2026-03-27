/**
 * PM Flow — AI Panel Component
 * Right panel for AI execution: recipe selection, running tasks, streaming responses.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAi } from '../../features/ai/AiContext';
import { useBundle } from '../../features/bundle/BundleContext';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { TASK_RECIPES, getRecipe } from '../../lib/ai/taskRecipes';
import { providerRegistry } from '../../lib/ai/providerRegistry';
import { writeFileContent } from '../../lib/filesystem/fileOps';
import './AiPanel.css';

// === Icons ===

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 2L12 7L3 12V2Z" fill="currentColor" />
  </svg>
);

const StopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="3" y="3" width="8" height="8" rx="1" fill="currentColor" />
  </svg>
);

const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M11 13H3C2.45 13 2 12.55 2 12V2C2 1.45 2.45 1 3 1H9L12 4V12C12 12.55 11.55 13 11 13Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 13V8H4V13M4 1V4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M7 1V2.5M7 11.5V13M1 7H2.5M11.5 7H13M2.5 2.5L3.5 3.5M10.5 10.5L11.5 11.5M11.5 2.5L10.5 3.5M3.5 10.5L2.5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const AppendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// === Settings Modal ===

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [apiKey, setApiKey] = useState(providerRegistry.getApiKey('anthropic'));
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    providerRegistry.setApiKey('anthropic', apiKey);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  }, [apiKey, onClose]);

  return (
    <div className="ai-settings" id="ai-settings">
      <div className="ai-settings-header">
        <span className="text-sm font-semibold">AI Settings</span>
        <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="ai-settings-body">
        <div className="ai-settings-field">
          <label className="text-xs text-secondary">Anthropic API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="ai-settings-input"
            id="anthropic-api-key-input"
          />
        </div>
        <button
          className={`btn btn-sm ${saved ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handleSave}
          style={{ width: '100%' }}
        >
          {saved ? '✓ Saved' : 'Save API Key'}
        </button>
      </div>
    </div>
  );
}

// === AI Panel ===

export function AiPanel() {
  const { state: aiState, runTask, cancelTask, setRecipe, setModel, setCustomPrompt, clearResponse } = useAi();
  const { state: bundleState } = useBundle();
  const { state: workspaceState, refreshFileTree } = useWorkspace();
  const [showSettings, setShowSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Auto-scroll response
  useEffect(() => {
    if (responseRef.current && aiState.status === 'streaming') {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [aiState.currentResponse, aiState.status]);

  const handleRun = useCallback(async () => {
    const recipe = getRecipe(aiState.selectedRecipeId);
    if (!recipe) return;

    if (bundleState.items.length === 0) {
      alert('Add files to the bundle first');
      return;
    }

    if (!providerRegistry.hasApiKey('anthropic')) {
      setShowSettings(true);
      return;
    }

    await runTask(recipe, bundleState.items);
  }, [aiState.selectedRecipeId, bundleState.items, runTask]);

  const handleSaveNewFile = useCallback(async () => {
    if (!aiState.currentResponse || !workspaceState.workspacePath) return;

    const name = prompt('File name:', 'ai-output.md');
    if (!name) return;

    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    const filePath = `${workspaceState.workspacePath}/${fileName}`;

    try {
      await writeFileContent(filePath, aiState.currentResponse);
      await refreshFileTree();
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus(`Error: ${err}`);
    }
  }, [aiState.currentResponse, workspaceState.workspacePath, refreshFileTree]);

  const handleAppendToFile = useCallback(async () => {
    if (!aiState.currentResponse || !workspaceState.activeFilePath) return;

    try {
      const { readFileContent } = await import('../../lib/filesystem/fileOps');
      const existing = await readFileContent(workspaceState.activeFilePath);
      const updated = existing + '\n\n---\n\n' + aiState.currentResponse;
      await writeFileContent(workspaceState.activeFilePath, updated);
      setSaveStatus('Appended!');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus(`Error: ${err}`);
    }
  }, [aiState.currentResponse, workspaceState.activeFilePath]);

  const isRunning = aiState.status === 'streaming' || aiState.status === 'calling-provider' || aiState.status === 'building-bundle';
  const hasResponse = aiState.currentResponse.length > 0;
  const models = providerRegistry.getProvider('anthropic')?.listModels() || [];

  if (showSettings) {
    return <SettingsPanel onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="ai-panel" id="ai-panel">
      {/* Header */}
      <div className="ai-panel-header">
        <span className="panel-title">Ask AI</span>
        <button
          className="btn btn-icon btn-ghost"
          onClick={() => setShowSettings(true)}
          title="AI Settings"
          aria-label="AI Settings"
        >
          <GearIcon />
        </button>
      </div>

      {/* Controls */}
      <div className="ai-panel-controls">
        {/* Recipe Selection */}
        <div className="ai-control-group">
          <label className="text-xs text-secondary">Task Recipe</label>
          <select
            value={aiState.selectedRecipeId}
            onChange={(e) => setRecipe(e.target.value)}
            className="ai-select"
            id="recipe-select"
          >
            {TASK_RECIPES.map(recipe => (
              <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
            ))}
          </select>
          <p className="text-xs text-tertiary" style={{ marginTop: 'var(--space-1)' }}>
            {getRecipe(aiState.selectedRecipeId)?.description}
          </p>
        </div>

        {/* Model Selection */}
        <div className="ai-control-group">
          <label className="text-xs text-secondary">Model</label>
          <select
            value={aiState.selectedModel}
            onChange={(e) => setModel(e.target.value)}
            className="ai-select"
            id="model-select"
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>

        {/* Custom Prompt (for custom recipe) */}
        {aiState.selectedRecipeId === 'custom' && (
          <div className="ai-control-group">
            <label className="text-xs text-secondary">Custom Instructions</label>
            <textarea
              value={aiState.customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter your custom prompt..."
              className="ai-custom-prompt"
              rows={3}
              id="custom-prompt-input"
            />
          </div>
        )}

        {/* Bundle Status */}
        <div className="ai-bundle-status">
          <span className="text-xs text-secondary">
            Bundle: {bundleState.items.length} files
            {bundleState.metadata && ` · ~${bundleState.metadata.estimatedTokens.toLocaleString()} tokens`}
          </span>
        </div>

        {/* Run Button */}
        <button
          className={`btn btn-lg ${isRunning ? 'btn-danger' : 'btn-primary'}`}
          onClick={isRunning ? cancelTask : handleRun}
          disabled={bundleState.items.length === 0 && !isRunning}
          style={{ width: '100%' }}
          id="run-ai-button"
        >
          {isRunning ? (
            <><StopIcon /> Cancel</>
          ) : (
            <><PlayIcon /> Run AI</>
          )}
        </button>
      </div>

      {/* Status */}
      {aiState.status !== 'idle' && (
        <div className="ai-status">
          <div className={`ai-status-indicator ${aiState.status}`}>
            {aiState.status === 'streaming' && <span className="animate-pulse">●</span>}
            {aiState.status === 'complete' && <span style={{ color: 'var(--color-success)' }}>✓</span>}
            {aiState.status === 'error' && <span style={{ color: 'var(--color-error)' }}>✕</span>}
            <span className="text-xs">
              {aiState.status === 'building-bundle' && 'Building bundle...'}
              {aiState.status === 'applying-recipe' && 'Applying recipe...'}
              {aiState.status === 'calling-provider' && 'Calling AI...'}
              {aiState.status === 'streaming' && 'Streaming response...'}
              {aiState.status === 'complete' && `Complete${aiState.lastResponse ? ` · ${aiState.lastResponse.outputTokens} tokens · ${((aiState.lastResponse.duration || 0) / 1000).toFixed(1)}s` : ''}`}
              {aiState.status === 'error' && 'Error'}
              {aiState.status === 'cancelled' && 'Cancelled'}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {aiState.error && (
        <div className="ai-error">
          <p className="text-xs">{aiState.error}</p>
        </div>
      )}

      {/* Response */}
      {hasResponse && (
        <div className="ai-response" ref={responseRef} id="ai-response">
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aiState.currentResponse}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Save Actions */}
      {hasResponse && aiState.status === 'complete' && (
        <div className="ai-save-actions">
          {saveStatus && (
            <span className="text-xs text-accent">{saveStatus}</span>
          )}
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleSaveNewFile}
            id="save-new-file-button"
          >
            <SaveIcon /> Save as file
          </button>
          {workspaceState.activeFilePath && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleAppendToFile}
              id="append-to-file-button"
            >
              <AppendIcon /> Append to current
            </button>
          )}
          <button
            className="btn btn-sm btn-ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(aiState.currentResponse);
              setSaveStatus('Copied!');
              setTimeout(() => setSaveStatus(null), 2000);
            }}
          >
            Copy
          </button>
          <button className="btn btn-sm btn-ghost" onClick={clearResponse}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
