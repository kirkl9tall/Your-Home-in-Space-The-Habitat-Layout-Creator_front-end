import React from 'react';
import useStore from '../store/useStore';
import { CubeIcon, SphereIcon, CylinderIcon, TorusIcon, ConeIcon, PlaneIcon } from './icons';

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
      </div>
    </aside>
  );
};

export default Toolbar;
