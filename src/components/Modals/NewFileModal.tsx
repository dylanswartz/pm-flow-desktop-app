/**
 * PM Flow — New File Modal
 * Allows creating a new markdown file from a configured template.
 */

import { useState, useCallback } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { useSettings } from '../../features/settings/SettingsContext';
import './Modals.css';

interface NewFileModalProps {
  onClose: () => void;
  baseDirectory?: string; // If omitted, uses workspace root
}

export function NewFileModal({ onClose, baseDirectory }: NewFileModalProps) {
  const { state: workspaceState, createFile } = useWorkspace();
  const { settings, getTemplate } = useSettings();
  const [fileName, setFileName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('pm-context');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !workspaceState.workspacePath) return;

    setIsSubmitting(true);
    try {
      let finalName = fileName.trim();
      if (!finalName.endsWith('.md')) {
        finalName += '.md';
      }

      const dirPath = baseDirectory || workspaceState.workspacePath;
      
      let content = '';
      if (selectedTemplateId) {
        const template = getTemplate(selectedTemplateId);
        if (template) {
          // Replace <Title> with the filename without extension
          content = template.content.replace(/<Title>/g, finalName.replace(/\.md$/, ''));
          content = content.replace(/<date>/g, new Date().toISOString().split('T')[0]);
        }
      }

      await createFile(dirPath, finalName, content);
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }, [fileName, workspaceState.workspacePath, baseDirectory, selectedTemplateId, getTemplate, createFile, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} id="new-file-modal">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New File</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>File Name</label>
            <input
              type="text"
              autoFocus
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder="e.g. prd-onboarding.md"
              className="modal-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Template</label>
            <select
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
              className="modal-select"
            >
              <option value="">Blank File</option>
              {settings.templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !fileName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
