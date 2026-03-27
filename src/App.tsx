/**
 * PM Flow — Application Root
 */


import { WorkspaceProvider } from './features/workspace/WorkspaceContext';
import { BundleProvider } from './features/bundle/BundleContext';
import { AiProvider } from './features/ai/AiContext';
import { SettingsProvider } from './features/settings/SettingsContext';
import { AppShell } from './components/Layout/AppShell';
import './styles/global.css';

export default function App() {
  return (
    <SettingsProvider>
      <WorkspaceProvider>
        <BundleProvider>
          <AiProvider>
            <AppShell />
          </AiProvider>
        </BundleProvider>
      </WorkspaceProvider>
    </SettingsProvider>
  );
}
