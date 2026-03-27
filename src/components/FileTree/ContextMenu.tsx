/**
 * PM Flow — Context Menu
 * A custom right-click context menu for the file tree.
 */

import { useEffect } from 'react';
import './ContextMenu.css';

export interface ContextMenuProps {
  x: number;
  y: number;
  isDir: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ContextMenu({ x, y, isDir, onRename, onDuplicate, onDelete, onClose }: ContextMenuProps) {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  // Prevent default context menu from overwriting ours
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="context-menu" 
      style={{ top: y, left: x }}
      onClick={e => e.stopPropagation()}
      onContextMenu={handleContextMenu}
    >
      <button className="context-menu-item" onClick={onRename}>
        Rename
      </button>
      {!isDir && (
        <button className="context-menu-item" onClick={onDuplicate}>
          Duplicate
        </button>
      )}
      <div className="context-menu-divider" />
      <button className="context-menu-item destructive" onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
