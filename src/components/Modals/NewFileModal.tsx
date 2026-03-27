/**
 * PM Flow — New File Modal
 * Allows creating a new markdown file using PM Flow's template system.
 */

import { useState, useCallback, useEffect } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { TEMPLATE_DEFINITIONS, TemplateType } from '../../lib/templates/definitions';
import './Modals.css';

interface NewFileModalProps {
  onClose: () => void;
  baseDirectory?: string; // If omitted, uses workspace root
}

export function NewFileModal({ onClose, baseDirectory }: NewFileModalProps) {
  const { state: workspaceState, createFileFromTemplate } = useWorkspace();
  const [fileName, setFileName] = useState('');
  const [selectedType, setSelectedType] = useState<TemplateType>('context');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetDir, setTargetDir] = useState<string | null>(baseDirectory || null);

  useEffect(() => {
    if (baseDirectory) setTargetDir(baseDirectory);
  }, [baseDirectory]);

  const handleChangeLocation = useCallback(async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: targetDir || workspaceState.workspacePath || undefined
    });
    if (selected) {
      setTargetDir(selected as string);
    }
  }, [targetDir, workspaceState.workspacePath]);

  // If Daily is selected, pre-fill the date as name
  useEffect(() => {
    if (selectedType === 'daily') {
      const now = new Date().toISOString().split('T')[0];
      setFileName(now);
    } else if (fileName === new Date().toISOString().split('T')[0]) {
      setFileName(''); // Clear it if switching back from Daily
    }
  }, [selectedType, fileName]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceState.workspacePath) return;
    if (selectedType !== 'daily' && !fileName.trim()) return;

    setIsSubmitting(true);
    try {
      const finalDir = selectedType === 'daily' ? `${workspaceState.workspacePath}/02_daily` : (targetDir || workspaceState.workspacePath as string);
      await createFileFromTemplate(selectedType, fileName.trim(), finalDir);
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }, [fileName, workspaceState.workspacePath, baseDirectory, selectedType, createFileFromTemplate, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} id="new-file-modal">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New File</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>File Type</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as TemplateType)}
              className="modal-select"
              id="template-type-select"
            >
              {Object.values(TEMPLATE_DEFINITIONS).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>File Name</label>
            <input
              type="text"
              autoFocus={selectedType !== 'daily'}
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder="e.g. prd-onboarding"
              className="modal-input"
              required
              disabled={selectedType === 'daily'}
              id="file-name-input"
            />
            {selectedType === 'daily' && (
              <small className="text-tertiary" style={{ display: 'block', marginTop: '4px' }}>
                Daily files are automatically named by date and stored in <code>/02_daily/</code>
              </small>
            )}
            {selectedType === 'shared-context' && (
              <small className="text-tertiary" style={{ display: 'block', marginTop: '4px' }}>
                Used for reusable domain knowledge
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Location</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="modal-input text-xs truncate" style={{ flex: 1, backgroundColor: 'var(--color-bg-tertiary)', paddingTop: '10px' }}>
                {selectedType === 'daily' 
                  ? `${workspaceState.workspacePath?.split('/').pop() || ''}/02_daily`
                  : (targetDir ? targetDir.replace(workspaceState.workspacePath || '', '').replace(/^[\/\\]/, '') || '/' : '/')
                }
              </div>
              {selectedType !== 'daily' && (
                <button type="button" className="btn btn-sm btn-ghost" onClick={handleChangeLocation}>
                  Change
                </button>
              )}
            </div>
            {selectedType !== 'daily' && !targetDir && (
              <small className="text-warning" style={{ display: 'block', marginTop: '4px' }}>
                Creating in workspace root
              </small>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting || (selectedType !== 'daily' && !fileName.trim())}
              id="create-file-submit"
            >
              {isSubmitting ? 'Creating...' : (selectedType === 'daily' ? 'Open / Create Daily' : 'Create File')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
