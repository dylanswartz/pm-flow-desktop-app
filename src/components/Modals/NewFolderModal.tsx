/**
 * PM Flow — New Folder Modal
 * Allows creating a new directory inside the workspace.
 */

import { useState, useCallback } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import './Modals.css';

interface NewFolderModalProps {
  onClose: () => void;
  baseDirectory?: string; // If omitted, uses workspace root
}

export function NewFolderModal({ onClose, baseDirectory }: NewFolderModalProps) {
  const { state: workspaceState, createDirectory } = useWorkspace();
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim() || !workspaceState.workspacePath) return;

    setIsSubmitting(true);
    try {
      const finalName = folderName.trim();
      const dirPath = baseDirectory || workspaceState.workspacePath;
      
      await createDirectory(dirPath, finalName);
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }, [folderName, workspaceState.workspacePath, baseDirectory, createDirectory, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} id="new-folder-modal">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Folder</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Folder Name</label>
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              placeholder="e.g. 01_Product_Specs"
              className="modal-input"
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !folderName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
