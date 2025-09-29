import React, { useEffect } from 'react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import Inspector from './components/Inspector';
import CanvasContainer from './components/CanvasContainer';
import useStore from './store/useStore';

/**
 * A new status bar component for the bottom of the screen.
 */
const StatusBar: React.FC = () => {
  const { gizmoMode, isSnappingEnabled, selectedObjectIds, objects } = useStore();
  const selectedCount = selectedObjectIds.length;
  const objectCount = objects.length;
  
  return (
    <footer className="h-6 bg-[#007acc] text-white flex items-center justify-between px-4 text-xs z-30">
        <div className="flex items-center gap-4">
            <span>Ready</span>
        </div>
        <div className="flex items-center gap-4">
            <span>{`Selected: ${selectedCount} / ${objectCount}`}</span>
            <span className="w-px h-3 bg-white/30"></span>
            <span className="capitalize">{`Mode: ${gizmoMode}`}</span>
            <span className="w-px h-3 bg-white/30"></span>
            <span>{`Snapping: ${isSnappingEnabled ? 'On' : 'Off'}`}</span>
        </div>
    </footer>
  );
};


/**
 * The main application component, orchestrating the professional CAD tool interface.
 */
const App: React.FC = () => {
  const { undo, redo, duplicateSelectedObjects, removeSelectedObjects, setGizmoMode, toggleFocusMode } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts from firing while typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      
      if (e.ctrlKey || e.metaKey) {
        switch (key) {
          case 'z': e.preventDefault(); undo(); break;
          case 'y': e.preventDefault(); redo(); break;
          case 'd': e.preventDefault(); duplicateSelectedObjects(); break;
        }
      } else {
        switch(key) {
          case 'delete':
          case 'backspace':
            e.preventDefault();
            removeSelectedObjects();
            break;
          case 't': setGizmoMode('translate'); break;
          case 'r': setGizmoMode('rotate'); break;
          case 's': setGizmoMode('scale'); break;
          case 'f': e.preventDefault(); toggleFocusMode(); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, duplicateSelectedObjects, removeSelectedObjects, setGizmoMode, toggleFocusMode]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-gray-300 font-sans antialiased">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        <main className="flex-1 h-full relative bg-[#252526]">
          <CanvasContainer />
        </main>
        <Inspector />
      </div>
      <StatusBar />
    </div>
  );
};

export default App;
