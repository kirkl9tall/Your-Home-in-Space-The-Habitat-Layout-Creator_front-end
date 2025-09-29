import React from 'react';
import useStore from '../store/useStore';
import { CubeIcon, SphereIcon, CylinderIcon, TorusIcon, ConeIcon, PlaneIcon } from './icons';
import { Upload } from 'lucide-react';

/**
 * A reusable, professionally styled button for the toolbar.
 */
const ToolButton: React.FC<{ onClick: () => void; children: React.ReactNode; label: string }> = ({ onClick, children, label }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center w-14 h-14 text-gray-300 rounded-md hover:bg-white/10 hover:text-cyan-300 transition-colors duration-150"
    title={`Add ${label}`}
  >
    {children}
  </button>
);

/**
 * The Toolbar component, rebuilt with a professional aesthetic.
 * Provides cleanly designed buttons for adding shapes to the scene.
 */
const Toolbar: React.FC = () => {
  const addObject = useStore((state) => state.addObject);
  const addImportedObject = useStore((state) => state.addImportedObject);

  const importGLTFFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.gltf,.glb';
    input.multiple = false;
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        // Create blob URL for the file
        const url = URL.createObjectURL(file);
        
        // Add the imported GLTF using the existing store function
        addImportedObject({ 
          modelUrl: url,
          fileMap: { [file.name]: url }
        });
        
        alert(`Successfully imported: ${file.name}`);
      } catch (error) {
        console.error('GLTF import error:', error);
        alert(`Error importing GLTF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    input.click();
  };

  return (
    <aside className="w-20 bg-[#252526] border-r border-black/30 p-2 flex flex-col items-center">
      <div className="flex flex-col items-center space-y-2 w-full mt-2">
        <ToolButton onClick={() => addObject('cube')} label="Cube">
          <CubeIcon className="w-8 h-8"/>
        </ToolButton>
        <ToolButton onClick={() => addObject('sphere')} label="Sphere">
          <SphereIcon className="w-8 h-8"/>
        </ToolButton>
        <ToolButton onClick={() => addObject('cylinder')} label="Cylinder">
          <CylinderIcon className="w-8 h-8"/>
        </ToolButton>
        <ToolButton onClick={() => addObject('torus')} label="Torus">
          <TorusIcon className="w-8 h-8"/>
        </ToolButton>
        <ToolButton onClick={() => addObject('cone')} label="Cone">
          <ConeIcon className="w-8 h-8"/>
        </ToolButton>
        <ToolButton onClick={() => addObject('plane')} label="Plane">
          <PlaneIcon className="w-8 h-8"/>
        </ToolButton>
        
        {/* Separator */}
        <div className="w-full h-px bg-gray-600 my-2"></div>
        
        {/* Import GLTF Button */}
        <ToolButton onClick={importGLTFFile} label="Import GLTF">
          <Upload className="w-8 h-8"/>
        </ToolButton>
      </div>
    </aside>
  );
};

export default Toolbar;
