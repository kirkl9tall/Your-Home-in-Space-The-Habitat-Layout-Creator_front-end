import React from 'react';
import ReactDOM from 'react-dom';
import { AppLogoIcon, CloseIcon } from './icons';

interface HelpModalProps {
  onClose: () => void;
}

const Shortcut: React.FC<{ keys: string; description: string }> = ({ keys, description }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-[var(--color-border-light)]/30 last:border-b-0">
        <span className="text-[var(--color-text-primary)]">{description}</span>
        <kbd className="px-2 py-1 text-xs font-sans font-semibold text-[var(--color-text-secondary)] bg-[var(--color-panel-light)] border border-[var(--color-border)] rounded-md shadow-sm">{keys}</kbd>
    </div>
);

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-md font-semibold text-[var(--color-accent)] mb-2 mt-4 first:mt-0">{title}</h3>
        <div className="flex flex-col text-sm">
            {children}
        </div>
    </div>
);

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[var(--color-panel)]/80 rounded-lg border border-white/10 shadow-2xl p-6 m-4 max-h-[90vh] overflow-y-auto animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                <AppLogoIcon className="w-8 h-8 text-[var(--color-accent)]" />
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Help & Shortcuts</h2>
            </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-panel-light)] hover:text-white transition-colors"
            aria-label="Close help"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
            <HelpSection title="Viewport Navigation">
                <Shortcut keys="LMB Drag / Middle Mouse Drag" description="Orbit Camera" />
                <Shortcut keys="RMB Drag / Ctrl + LMB Drag" description="Pan Camera" />
                <Shortcut keys="Scroll Wheel" description="Zoom In / Out" />
            </HelpSection>
            
            <HelpSection title="Object Manipulation">
                <Shortcut keys="LMB Click" description="Select Object" />
                <Shortcut keys="Shift + LMB Click" description="Add/Remove from Selection" />
                <Shortcut keys="T" description="Activate Move Tool" />
                <Shortcut keys="R" description="Activate Rotate Tool" />
                <Shortcut keys="S" description="Activate Scale Tool" />
                <Shortcut keys="F" description="Focus on Selected Object(s)" />
            </HelpSection>

            <HelpSection title="Editing & Scene Management">
                <Shortcut keys="Ctrl / Cmd + Z" description="Undo" />
                <Shortcut keys="Ctrl / Cmd + Y" description="Redo" />
                <Shortcut keys="Ctrl / Cmd + D" description="Duplicate Selection" />
                <Shortcut keys="Delete / Backspace" description="Delete Selection" />
                <Shortcut keys="Ctrl / Cmd + G" description="Group Selection" />
                <Shortcut keys="Ctrl / Cmd + Shift + G" description="Ungroup Selection" />
            </HelpSection>
            
             <HelpSection title="Tools">
                <Shortcut keys="M" description="Toggle Measurement Tool" />
                <Shortcut keys="Escape" description="Cancel Current Measurement / Close Modal" />
            </HelpSection>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default HelpModal;