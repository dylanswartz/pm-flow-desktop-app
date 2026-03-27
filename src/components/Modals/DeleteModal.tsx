/**
 * PM Flow — Delete Modal
 * Confirms deletion of a file or directory.
 */

import { useState } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import './Modals.css';

interface DeleteModalProps {
  nodePath: string;
  nodeName: string;
  isDir: boolean;
  onClose: () => void;
}

export function DeleteModal({ nodePath, nodeName, isDir, onClose }: DeleteModalProps) {
  const { deleteNode } = useWorkspace();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteNode(nodePath, isDir);
      onClose();
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="delete-modal">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Delete {isDir ? 'Folder' : 'File'}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Are you sure you want to permanently delete <strong>{nodeName}</strong>
            {isDir ? ' and all its contents' : ''}?
          </p>
          <p className="text-xs text-tertiary" style={{ marginTop: 'var(--space-2)' }}>
            This action cannot be undone.
          </p>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ background: 'var(--color-error)' }}
              onClick={handleDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
