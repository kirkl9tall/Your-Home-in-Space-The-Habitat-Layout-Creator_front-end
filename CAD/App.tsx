import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Inspector from './components/Inspector';
import CanvasContainer from './components/CanvasContainer';
import useStore from './store/useStore';
import ToastContainer from './components/Toast';
import LoadingOverlay from './components/LoadingOverlay';
import { ChevronLeftIcon, ChevronRightIcon, HelpIcon, CameraIcon } from './components/icons';
import HelpModal from './components/HelpModal';
import Toolbar from './components/Toolbar';

const StatusBar: React.FC = () => {
  const { gizmoMode, isSnappingEnabled, selectedObjectIds, objects } = useStore();
  const selectedCount = selectedObjectIds.length;
  const objectCount = Object.keys(objects).length;
  
  return (
    <footer className="h-6 bg-[var(--color-panel)] border-t border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center justify-between px-4 text-xs z-30 select-none">
        <div className="flex items-center gap-4">
            <span>Ready</span>
        </div>
        <div className="flex items-center gap-4">
            <span>{`Selected: ${selectedCount} / ${objectCount}`}</span>
            <span className="w-px h-3 bg-[var(--color-border)]"></span>
            <span className="capitalize">{`Mode: ${gizmoMode}`}</span>
            <span className="w-px h-3 bg-[var(--color-border)]"></span>
            <span>{`Snapping: ${isSnappingEnabled ? 'On' : 'Off'}`}</span>
        </div>
    </footer>
  );
};


const App: React.FC = () => {
  const { 
    undo, redo, duplicateSelectedObjects, removeSelectedObjects, 
    setGizmoMode, toggleFocusMode, groupSelectedObjects, ungroupSelectedObjects, 
    toggleMeasureMode, cancelCurrentMeasurement,
    isInspectorCollapsed, toggleInspector,
    isToolbarCollapsed, toggleToolbar,
  } = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCameraInfoOpen, setIsCameraInfoOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      
      if (e.ctrlKey || e.metaKey) {
        switch (key) {
          case 'z': e.preventDefault(); undo(); break;
          case 'y': e.preventDefault(); redo(); break;
          case 'd': e.preventDefault(); duplicateSelectedObjects(); break;
          case 'g': 
            e.preventDefault();
            e.shiftKey ? ungroupSelectedObjects() : groupSelectedObjects();
            break;
        }
      } else {
        switch(key) {
          case 'delete': case 'backspace': e.preventDefault(); removeSelectedObjects(); break;
          case 't': setGizmoMode('translate'); break;
          case 'r': setGizmoMode('rotate'); break;
          case 's': setGizmoMode('scale'); break;
          case 'f': e.preventDefault(); toggleFocusMode(); break;
          case 'm': e.preventDefault(); toggleMeasureMode(); break;
          case 'escape': 
            cancelCurrentMeasurement();
            if (isHelpOpen) setIsHelpOpen(false);
            if (isCameraInfoOpen) setIsCameraInfoOpen(false);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateSelectedObjects, removeSelectedObjects, setGizmoMode, toggleFocusMode, groupSelectedObjects, ungroupSelectedObjects, toggleMeasureMode, cancelCurrentMeasurement, isHelpOpen, isCameraInfoOpen]);
  
  const inspectorWidth = isInspectorCollapsed ? '0rem' : '16rem'; // w-64
  const toolbarWidth = isToolbarCollapsed ? '0rem' : '14rem'; // w-56

  return (
    <div className={`flex flex-col h-screen w-screen bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans antialiased transition-opacity duration-500 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
      <Header />
      <div 
        className="grid flex-1 overflow-hidden"
        style={{
          gridTemplateColumns: `${toolbarWidth} 1fr ${inspectorWidth}`,
          transition: 'grid-template-columns 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Toolbar Panel */}
        <aside className={`bg-[var(--color-panel)] overflow-hidden ${!isToolbarCollapsed ? 'border-r border-[var(--color-border)]' : ''}`}>
           <div className="w-56 h-full"> {/* Fixed width inner container */}
            <Toolbar />
          </div>
        </aside>

        {/* Main Content */}
        <main className="h-full relative bg-[var(--color-background)] overflow-hidden">
          <CanvasContainer isCameraInfoOpen={isCameraInfoOpen} setCameraInfoOpen={setIsCameraInfoOpen} inspectorWidth={inspectorWidth} toolbarWidth={toolbarWidth} />
          
           <button 
            onClick={toggleToolbar} 
            aria-label={isToolbarCollapsed ? 'Show Toolbar' : 'Hide Toolbar'}
            className="absolute top-1/2 -translate-y-1/2 left-0 z-20 w-4 h-20 bg-[var(--color-panel)]/50 hover:bg-[var(--color-accent)] text-white/50 hover:text-white border border-l-0 border-[var(--color-border)] rounded-r-md flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] opacity-50 hover:opacity-100"
          >
            <ChevronRightIcon className={`w-4 h-4 transition-transform duration-300 ${isToolbarCollapsed ? 'rotate-180' : ''}`} />
          </button>


          <button 
            onClick={toggleInspector} 
            aria-label={isInspectorCollapsed ? 'Show Inspector' : 'Hide Inspector'}
            className="absolute top-1/2 -translate-y-1/2 right-0 z-20 w-4 h-20 bg-[var(--color-panel)]/50 hover:bg-[var(--color-accent)] text-white/50 hover:text-white border border-r-0 border-[var(--color-border)] rounded-l-md flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] opacity-50 hover:opacity-100"
          >
            <ChevronLeftIcon className={`w-4 h-4 transition-transform duration-300 ${isInspectorCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </main>
        
        {/* Inspector Panel */}
        <aside className={`bg-[var(--color-panel)] overflow-hidden ${!isInspectorCollapsed ? 'border-l border-[var(--color-border)]' : ''}`}>
           <div className="w-64 h-full"> {/* Fixed width inner container */}
            <Inspector />
          </div>
        </aside>
      </div>

      <div 
        className="fixed bottom-8 z-30 flex items-center gap-2"
        style={{ left: `calc(${toolbarWidth} + 1rem)`, transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <button
          onClick={() => setIsCameraInfoOpen(true)}
          aria-label="Show camera controls"
          title="Camera Controls"
          className="w-10 h-10 flex items-center justify-center bg-[var(--color-panel-light)]/80 backdrop-blur-sm text-[var(--color-text-secondary)] rounded-full shadow-lg border border-[var(--color-border)] hover:bg-[var(--color-accent)] hover:text-white hover:scale-110 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <CameraIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsHelpOpen(true)}
          aria-label="Show help"
          title="Help & Shortcuts"
          className="w-10 h-10 flex items-center justify-center bg-[var(--color-panel-light)]/80 backdrop-blur-sm text-[var(--color-text-secondary)] rounded-full shadow-lg border border-[var(--color-border)] hover:bg-[var(--color-accent)] hover:text-white hover:scale-110 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <HelpIcon className="w-5 h-5" />
        </button>
      </div>

      <StatusBar />
      <ToastContainer />
      <LoadingOverlay />
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
    </div>
  );
};

export default App;