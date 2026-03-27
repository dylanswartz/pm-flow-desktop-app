/**
 * PM Flow — Rename Modal
 * Allows renaming a file or directory.
 */

import { useState, useCallback, useEffect } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import './Modals.css';

interface RenameModalProps {
  nodePath: string;
  nodeName: string;
  onClose: () => void;
}

export function RenameModal({ nodePath, nodeName, onClose }: RenameModalProps) {
  const { renameNode } = useWorkspace();
  const [newName, setNewName] = useState(nodeName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Select filename without extension
    const input = document.getElementById('rename-input') as HTMLInputElement;
    if (input) {
      input.focus();
      const dotIndex = nodeName.lastIndexOf('.');
      if (dotIndex > 0) {
        input.setSelectionRange(0, dotIndex);
      } else {
        input.select();
      }
    }
  }, [nodeName]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName === nodeName) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await renameNode(nodePath, newName.trim());
      onClose();
    } catch (err) {
      console.error('Rename failed:', err);
      setIsSubmitting(false);
    }
  }, [newName, nodeName, nodePath, renameNode, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} id="rename-modal">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rename {nodeName.endsWith('.md') ? 'File' : 'Folder'}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <input
              id="rename-input"
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="modal-input"
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !newName.trim()}>
              {isSubmitting ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
