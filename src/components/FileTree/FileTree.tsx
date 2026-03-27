/**
 * PM Flow — File Tree Component
 * Displays workspace files in a collapsible tree.
 */

import { useState, useCallback } from 'react';
import { type FileNode } from '../../lib/filesystem/fileOps';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { useBundle } from '../../features/bundle/BundleContext';
import './FileTree.css';

// === Icons ===

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 150ms ease' }}>
    <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M8 1H3.5C2.67 1 2 1.67 2 2.5V11.5C2 12.33 2.67 13 3.5 13H10.5C11.33 13 12 12.33 12 11.5V5L8 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 1V5H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FolderIcon = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    {open ? (
      <path d="M12 6.5V4.5C12 3.95 11.55 3.5 11 3.5H6.5L5 2H2.5C1.95 2 1.5 2.45 1.5 3V11C1.5 11.55 1.95 12 2.5 12H10.5L13 7H3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M12 11.5V4.5C12 3.95 11.55 3.5 11 3.5H6.5L5 2H2.5C1.95 2 1.5 2.45 1.5 3V11C1.5 11.55 1.95 12 2.5 12H11C11.55 12 12 11.55 12 11.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

const BundleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 3H10M2 6H10M2 9H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// === File Tree Item ===

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  activeFilePath: string | null;
  onFileClick: (path: string) => void;
  onAddToBundle: (path: string) => void;
  onMoveNode: (oldPath: string, newPath: string) => void;
}

function FileTreeItem({ node, depth, activeFilePath, onFileClick, onAddToBundle, onMoveNode }: FileTreeItemProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = useCallback(() => {
    if (node.isDir) {
      setExpanded(prev => !prev);
    } else {
      onFileClick(node.path);
    }
  }, [node, onFileClick]);

  const handleAddToBundle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node.isDir) {
      onAddToBundle(node.path);
    }
  }, [node, onAddToBundle]);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', node.path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.isDir && !isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.isDir) setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.isDir) {
      setIsDragOver(false);
      const oldPath = e.dataTransfer.getData('text/plain');
      if (!oldPath || oldPath === node.path) return;
      
      // Prevent nesting folder inside itself
      if (node.path.startsWith(oldPath + '/')) return;
      
      const fileName = oldPath.split('/').pop();
      if (!fileName) return;

      const newPath = `${node.path}/${fileName}`;
      // Basic check to ensure not moving into same folder
      if (oldPath !== newPath) {
        onMoveNode(oldPath, newPath);
      }
    }
  };

  const isActive = !node.isDir && node.path === activeFilePath;

  return (
    <div className="file-tree-item-wrapper">
      <div
        className={`file-tree-item ${isActive ? 'active' : ''} ${isDragOver ? 'drag-over' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
        role="treeitem"
        aria-expanded={node.isDir ? expanded : undefined}
        id={`file-tree-${node.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {node.isDir && (
          <span className="file-tree-chevron">
            <ChevronIcon expanded={expanded} />
          </span>
        )}
        <span className="file-tree-icon">
          {node.isDir ? <FolderIcon open={expanded} /> : <FileIcon />}
        </span>
        <span className="file-tree-name">{node.name}</span>
        {!node.isDir && (
          <button
            className="file-tree-action tooltip"
            data-tooltip="Add to bundle"
            onClick={handleAddToBundle}
            aria-label={`Add ${node.name} to bundle`}
          >
            <BundleIcon />
          </button>
        )}
      </div>
      {node.isDir && expanded && node.children && (
        <div className="file-tree-children" role="group">
          {node.children.map(child => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFilePath={activeFilePath}
              onFileClick={onFileClick}
              onAddToBundle={onAddToBundle}
              onMoveNode={onMoveNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// === File Tree ===

export function FileTree() {
  const { state, openFile, moveNode } = useWorkspace();
  const { addFile } = useBundle();
  const [isRootDragOver, setIsRootDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isRootDragOver) setIsRootDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
    const oldPath = e.dataTransfer.getData('text/plain');
    if (!oldPath || !state.workspacePath) return;

    const fileName = oldPath.split('/').pop();
    if (!fileName) return;

    const newPath = `${state.workspacePath}/${fileName}`;
    if (oldPath !== newPath) {
      moveNode(oldPath, newPath);
    }
  };

  if (state.fileTree.length === 0) {
    return (
      <div 
        className={`file-tree-empty ${isRootDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-sm text-tertiary">No markdown files found</p>
      </div>
    );
  }

  return (
    <div 
      className={`file-tree ${isRootDragOver ? 'drag-over-root' : ''}`} 
      role="tree" 
      id="file-tree"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {state.fileTree.map(node => (
        <FileTreeItem
          key={node.path}
          node={node}
          depth={0}
          activeFilePath={state.activeFilePath}
          onFileClick={openFile}
          onAddToBundle={addFile}
          onMoveNode={moveNode}
        />
      ))}
    </div>
  );
}
