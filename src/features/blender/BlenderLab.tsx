import React, { useEffect, useState } from 'react';
import Toolbar from './components/Toolbar';
import Inspector from './components/Inspector';
import CanvasContainer from './components/CanvasContainer';
import useStore from './store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Save } from 'lucide-react';

interface BlenderLabProps {
  onBackToDesign: () => void;
  onSaveModule?: (moduleData: any) => void;
}

/**
 * Module Save Dialog Component
 */
const ModuleSaveDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  objectCount: number;
}> = ({ isOpen, onClose, onSave, objectCount }) => {
  const [moduleName, setModuleName] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!moduleName.trim()) {
      alert('Please enter a module name');
      return;
    }
    onSave(moduleName.trim(), moduleDescription.trim());
    setModuleName('');
    setModuleDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-96 max-w-[90vw]">
        <h2 className="text-lg font-semibold mb-4">Save Custom Module</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="module-name">Module Name *</Label>
            <Input
              id="module-name"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder="e.g., Custom Sleep Pod"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="module-description">Description (Optional)</Label>
            <Input
              id="module-description"
              value={moduleDescription}
              onChange={(e) => setModuleDescription(e.target.value)}
              placeholder="Brief description of the module"
              className="mt-1"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            This module contains {objectCount} object{objectCount !== 1 ? 's' : ''}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Module
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Status bar component for the Blender Lab
 */
const StatusBar: React.FC = () => {
  const { gizmoMode, isSnappingEnabled, selectedObjectIds, objects } = useStore();
  const selectedCount = selectedObjectIds.length;
  const objectCount = objects.length;
  
  return (
    <footer className="h-6 bg-primary text-primary-foreground flex items-center justify-between px-4 text-xs z-30">
        <div className="flex items-center gap-4">
            <span>Blender Laboratory Ready</span>
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
 * The main Blender Laboratory component - a professional CAD interface
 * integrated with the space habitat designer
 */
const BlenderLab: React.FC<BlenderLabProps> = ({ onBackToDesign, onSaveModule }) => {
  const { undo, redo, duplicateSelectedObjects, removeSelectedObjects, setGizmoMode, toggleFocusMode, objects } = useStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);

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
          case 's': e.preventDefault(); setShowSaveDialog(true); break;
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
          case 'escape': onBackToDesign(); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, duplicateSelectedObjects, removeSelectedObjects, setGizmoMode, toggleFocusMode, onBackToDesign]);

  const handleSaveModule = (name: string, description: string) => {
    if (objects.length === 0) {
      alert('No objects to save');
      return;
    }

    const moduleData = {
      id: Date.now().toString(),
      name: name,
      description: description,
      type: 'CUSTOM_BLENDER',
      objects: objects,
      createdAt: new Date().toISOString(),
      objectCount: objects.length,
      // Generate a simple bounding box for the module
      bounds: calculateModuleBounds(objects)
    };

    if (onSaveModule) {
      onSaveModule(moduleData);
      alert(`Module "${name}" saved successfully!`);
      onBackToDesign();
    }
  };

  const calculateModuleBounds = (objects: any[]) => {
    if (objects.length === 0) return { width: 2, height: 2, depth: 2 };
    
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    objects.forEach(obj => {
      const [x, y, z] = obj.position;
      const [scaleX, scaleY, scaleZ] = obj.scale;
      
      minX = Math.min(minX, x - scaleX);
      maxX = Math.max(maxX, x + scaleX);
      minY = Math.min(minY, y - scaleY);
      maxY = Math.max(maxY, y + scaleY);
      minZ = Math.min(minZ, z - scaleZ);
      maxZ = Math.max(maxZ, z + scaleZ);
    });
    
    return {
      width: Math.max(maxX - minX, 1),
      height: Math.max(maxY - minY, 1),
      depth: Math.max(maxZ - minZ, 1)
    };
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground font-sans antialiased">
      {/* Custom Header with Back Button */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToDesign}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Designer
          </Button>
          <h1 className="text-xl font-bold">Blender Laboratory</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import GLTF
          </Button>
          <Button
            onClick={() => setShowSaveDialog(true)}
            size="sm"
            className="flex items-center gap-2"
            disabled={objects.length === 0}
          >
            <Save className="w-4 h-4" />
            Save Module ({objects.length} objects)
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        <main className="flex-1 h-full relative bg-muted/20">
          <CanvasContainer />
        </main>
        <Inspector />
      </div>
      <StatusBar />
      
      {/* Save Module Dialog */}
      <ModuleSaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveModule}
        objectCount={objects.length}
      />
    </div>
  );
};

export default BlenderLab;