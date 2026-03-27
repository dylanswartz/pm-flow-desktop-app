/**
 * PM Flow — Custom Titlebar
 * Integrated window controls and brand header.
 */

import { useCallback, useEffect, useState } from 'react';
import { getCurrentWindow, Window } from '@tauri-apps/api/window';
import './Titlebar.css';

export function Titlebar() {
  const [appWindow, setAppWindow] = useState<Window | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    setAppWindow(getCurrentWindow());
  }, []);

  useEffect(() => {
    if (!appWindow) return;

    // Keep maximized state in sync
    const checkMaximized = async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    };

    checkMaximized();
    
    // Tauri does not currently expose a "resized/maximized" JS event for every platform 
    // that works perfectly, but we can poll loosely or just trust the manual toggle.
    const unlisten = appWindow.onResized(() => checkMaximized());
    
    return () => {
      unlisten.then(u => u());
    };
  }, [appWindow]);

  const handleMinimize = useCallback(() => appWindow?.minimize(), [appWindow]);
  const handleToggleMaximize = useCallback(async () => {
    if (await appWindow?.isMaximized()) {
      await appWindow?.unmaximize();
      setIsMaximized(false);
    } else {
      await appWindow?.maximize();
      setIsMaximized(true);
    }
  }, [appWindow]);
  const handleClose = useCallback(() => appWindow?.close(), [appWindow]);

  return (
    <div className="titlebar" id="app-titlebar">
      {/* Separate drag region that doesn't overlap buttons */}
      <div data-tauri-drag-region className="titlebar-drag-region"></div>

      <div className="titlebar-left">
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none" className="titlebar-logo">
          <path d="M9 2L10.5 6.5L15 8L10.5 9.5L9 14L7.5 9.5L3 8L7.5 6.5L9 2Z" fill="url(#logo-grad-title)" />
          <defs>
            <linearGradient id="logo-grad-title" x1="3" y1="2" x2="15" y2="14">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <span className="titlebar-text">PM Flow</span>
      </div>

      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={handleMinimize} title="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6H9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
        <button className="titlebar-btn" onClick={handleToggleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="3.5" y="3.5" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5.5 2.5H8.5V5.5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </button>
        <button className="titlebar-btn titlebar-btn-close" onClick={handleClose} title="Close">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
