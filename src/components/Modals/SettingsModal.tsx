/**
 * PM Flow — Settings Modal
 * IDE-like settings editor for templates and API keys.
 */

import { useState } from 'react';
import { useSettings } from '../../features/settings/SettingsContext';
import { type FileTemplate } from '../../lib/config/settingsOps';
import { providerRegistry } from '../../lib/ai/providerRegistry';
import './Modals.css';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateTemplates } = useSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'templates'>('general');
  const [apiKey, setApiKey] = useState(providerRegistry.getApiKey('anthropic'));
  const [templatesJson, setTemplatesJson] = useState(() => JSON.stringify(settings.templates, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleSaveGeneral = () => {
    providerRegistry.setApiKey('anthropic', apiKey);
    alert('API Key saved!');
  };

  const handleSaveTemplates = async () => {
    try {
      const parsed = JSON.parse(templatesJson) as FileTemplate[];
      await updateTemplates(parsed);
      setJsonError(null);
      alert('Templates saved!');
    } catch (err) {
      setJsonError(`Invalid JSON: ${err}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="settings-modal">
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Settings</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <button 
            className={`btn btn-ghost ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
            style={{ borderRadius: 0, borderBottom: activeTab === 'general' ? '2px solid var(--color-accent)' : '2px solid transparent' }}
          >
            General
          </button>
          <button 
            className={`btn btn-ghost ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
            style={{ borderRadius: 0, borderBottom: activeTab === 'templates' ? '2px solid var(--color-accent)' : '2px solid transparent' }}
          >
            Templates
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'general' && (
            <div className="settings-pane">
              <div className="form-group">
                <label>Anthropic API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="modal-input"
                />
                <p className="text-xs text-tertiary" style={{ marginTop: 'var(--space-1)' }}>
                  Stored locally in your browser's localStorage.
                </p>
              </div>
              <button className="btn btn-primary" onClick={handleSaveGeneral}>Save Keys</button>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="settings-pane">
              <div className="form-group">
                <label>Template Configuration (JSON)</label>
                {jsonError && <p className="text-xs text-error" style={{ marginBottom: 'var(--space-2)' }}>{jsonError}</p>}
                <textarea
                  value={templatesJson}
                  onChange={e => {
                    setTemplatesJson(e.target.value);
                    setJsonError(null);
                  }}
                  className="modal-textarea"
                  spellCheck={false}
                />
                <p className="text-xs text-tertiary" style={{ marginTop: 'var(--space-1)' }}>
                  Define your file templates here. Use <code>{'<Title>'}</code> and <code>{'<date>'}</code> as variables.
                  Stored in your OS AppConfig directory (e.g. <code>~/.config/pmflow/pmflow.config.json</code>).
                </p>
              </div>
              <button className="btn btn-primary" onClick={handleSaveTemplates}>Save Templates</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
