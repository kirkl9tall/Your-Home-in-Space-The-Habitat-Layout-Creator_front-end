import React from 'react';
import useStore from '../store/useStore';
import { MagnetIcon, MoveIcon, RotateIcon, ScaleIcon, FocusIcon } from './icons';
import { GizmoMode } from '../types';

const ToolButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ label, isActive, onClick, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-md transition-colors duration-150 ${
      isActive
        ? 'text-cyan-400 bg-cyan-900/40'
        : 'text-gray-300 hover:bg-white/10'
    } disabled:text-gray-600 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
    title={label}
  >
    {children}
  </button>
);

/**
 * A floating toolbar in the viewport for controlling gizmo behavior and camera actions.
 */
const GizmoToolbar: React.FC = () => {
  const { 
    isSnappingEnabled, 
    toggleSnapping, 
    gizmoMode, 
    setGizmoMode, 
    selectedObjectIds,
    isFocusModeActive,
    toggleFocusMode,
  } = useStore();

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 p-1 bg-[#252526]/50 backdrop-blur-sm border border-black/20 rounded-lg shadow-lg">
      <div className="flex items-center">
        <ToolButton label="Move (T)" isActive={gizmoMode === 'translate'} onClick={() => setGizmoMode('translate')}>
          <MoveIcon className="w-5 h-5" />
        </ToolButton>
        <ToolButton label="Rotate (R)" isActive={gizmoMode === 'rotate'} onClick={() => setGizmoMode('rotate')}>
          <RotateIcon className="w-5 h-5" />
        </ToolButton>
        <ToolButton label="Scale (S)" isActive={gizmoMode === 'scale'} onClick={() => setGizmoMode('scale')}>
          <ScaleIcon className="w-5 h-5" />
        </ToolButton>
      </div>
      <div className="w-px h-6 bg-black/30"></div>
      <div className="flex items-center">
        <ToolButton
          label={`Toggle Snapping (${isSnappingEnabled ? 'On' : 'Off'})`}
          isActive={isSnappingEnabled}
          onClick={toggleSnapping}
        >
          <MagnetIcon className="w-5 h-5" />
        </ToolButton>
        <ToolButton
          onClick={toggleFocusMode}
          isActive={isFocusModeActive}
          disabled={selectedObjectIds.length === 0 && !isFocusModeActive}
          label="Focus on Selection (F)"
        >
          <FocusIcon className="w-5 h-5" />
        </ToolButton>
      </div>
    </div>
  );
};

export default GizmoToolbar;
