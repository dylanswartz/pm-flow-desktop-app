/**
 * PM Flow — Welcome Tab
 * A "Getting Started" experience loaded natively as a virtual tab.
 */

import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import './WelcomeTab.css';

// Minimal inline icons since we might not have them natively exposed in Editor
const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M14 13.5H2C1.72386 13.5 1.5 13.2761 1.5 13V3C1.5 2.72386 1.72386 2.5 2 2.5H6.08579C6.21839 2.5 6.34557 2.55268 6.43934 2.64645L7.79289 4H14C14.2761 4 14.5 4.22386 14.5 4.5V13C14.5 13.2761 14.2761 13.5 14 13.5Z" stroke="currentColor"/>
  </svg>
);

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M12.5 4.5V13C12.5 13.2761 12.2761 13.5 12 13.5H4C3.72386 13.5 3.5 13.2761 3.5 13V3C3.5 2.72386 3.72386 2.5 4 2.5H8.5L12.5 4.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.5 2.5V4.5H12.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function WelcomeTab() {
  const { selectWorkspace, createExampleWorkspace } = useWorkspace();

  return (
    <div className="welcome-tab-container animate-fadeIn">
      <div className="welcome-tab-layout">
        
        {/* Left Column: Intro & Actions */}
        <div className="welcome-tab-col">
          <header className="welcome-header">
            <h1 className="welcome-title">Welcome to PM Flow</h1>
            <p className="welcome-subtitle text-secondary">
              PM Flow helps you structure context, organize domain knowledge, and turn product thinking into AI-ready execution.
            </p>
          </header>

          <section className="welcome-section">
            <h3 className="welcome-heading">Core Workflow</h3>
            <ol className="welcome-list text-secondary">
              <li><strong>Define your domain</strong> – Create folders for product areas (e.g. <code>frontend/</code>, <code>admin-panel/</code>)</li>
              <li><strong>Capture structured context</strong> – Write standard markdown with frontmatter.</li>
              <li><strong>Build a bundle</strong> – Select files in the sidebar and arrange them.</li>
              <li><strong>Run AI</strong> – Apply Claude/LLM recipes against your context bundle.</li>
              <li><strong>Save outputs back</strong> – Turn AI suggestions directly into new specification files.</li>
            </ol>
          </section>

          <section className="welcome-section">
            <h3 className="welcome-heading">Start here</h3>
            <div className="welcome-actions">
              <button className="welcome-btn welcome-btn-primary" onClick={selectWorkspace}>
                <span className="welcome-icon"><FolderIcon /></span>
                <div>
                  <strong>Open existing workspace</strong>
                  <span className="text-xs text-tertiary block">Open a local folder on your computer</span>
                </div>
              </button>
              <button className="welcome-btn welcome-btn-secondary" onClick={createExampleWorkspace}>
                <span className="welcome-icon"><FileIcon /></span>
                <div>
                  <strong>Create example workspace</strong>
                  <span className="text-xs text-tertiary block">Generate a starter template to learn the ropes</span>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Visuals & Examples */}
        <div className="welcome-tab-col welcome-tab-right">
          <section className="welcome-card">
            <h4>Workspace Structure</h4>
            <p className="text-xs text-secondary mb-3">
              PM Flow reads standard files. Here is a typical layout:
            </p>
            <div className="welcome-code-block mb-4 text-xs">
              <div className="tree-line"><FolderIcon /> 00_templates/</div>
              <div className="tree-line indent-1"><FileIcon /> context-template.md</div>
              <div className="tree-line"><FolderIcon /> 01_domains/</div>
              <div className="tree-line indent-1"><FolderIcon /> project-phoenix/</div>
              <div className="tree-line indent-2"><FileIcon /> shared-context.md</div>
              <div className="tree-line indent-2"><FileIcon /> terminology.md</div>
              <div className="tree-line indent-2"><FolderIcon /> admin-dashboard/</div>
              <div className="tree-line indent-3"><FileIcon /> context.md</div>
              <div className="tree-line indent-3"><FileIcon /> notes.md</div>
              <div className="tree-line indent-3"><FileIcon /> iterations.md</div>
            </div>

            <h4>File Roles</h4>
            <ul className="welcome-list-compact text-xs text-secondary mb-4">
              <li><code>context.md</code> → structured source of truth for an initiative</li>
              <li><code>notes.md</code> → raw thinking, scratchpad</li>
              <li><code>iterations.md</code> → decisions and history over time</li>
              <li><code>shared-context.md</code> → reusable domain knowledge</li>
            </ul>

            <h4>Context Template</h4>
            <div className="welcome-code-block text-xs">
              <div className="token-comment">---</div>
              <div className="token-meta">title:</div> &lt;Title&gt;<br/>
              <div className="token-meta">type:</div> context<br/>
              <div className="token-meta">domain:</div> &lt;domain&gt;<br/>
              <div className="token-meta">area:</div> &lt;area&gt;<br/>
              <div className="token-comment">---</div>
              <br/>
              <div className="token-heading"># TLDR</div>
              <div className="token-heading"># Problem Definition</div>
              <div className="token-heading"># User & Use Case Context</div>
              <div className="token-heading"># Current State</div>
              <div className="token-heading"># Desired Outcome</div>
              <div className="token-heading"># Constraints & Guardrails</div>
              <div className="token-heading"># Open Questions</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
