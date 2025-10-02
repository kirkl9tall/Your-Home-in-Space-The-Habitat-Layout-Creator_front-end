import React, { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import { 
    MagnetIcon, MoveIcon, RotateIcon, ScaleIcon, FocusIcon, PerspectiveIcon, OrthoIcon, MeasureIcon, 
    GroupIcon, UngroupIcon, 
    ArrangeIcon, AlignMinIcon, AlignCenterIcon, AlignMaxIcon, DistributeHorizontalIcon, DistributeVerticalIcon, MirrorIcon
} from './icons';
import { GizmoMode } from '../types';

const ToolButton: React.FC<{
  label: string;
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ label, isActive = false, onClick, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2.5 rounded-lg transition-all duration-150 transform hover:scale-110 active:scale-100 ${
      isActive
        ? 'bg-[var(--color-accent)] text-white shadow-lg'
        : 'text-[var(--color-text-primary)] hover:bg-white/10'
    } disabled:text-[var(--color-text-disabled)] disabled:hover:bg-transparent disabled:cursor-not-allowed disabled:transform-none`}
    title={label}
  >
    {children}
  </button>
);


const ArrangeFlyout: React.FC = () => {
  const { 
      selectedObjectIds,
      alignSelectedObjects, 
      distributeSelectedObjects, 
      mirrorSelectedObjects 
  } = useStore();
  const canDistribute = selectedObjectIds.length >= 3;

  return (
    <div className="absolute top-full left-0 mt-2 p-3 w-[220px] bg-[var(--color-panel)]/80 backdrop-blur-md border border-white/10 rounded-xl shadow-lg animate-fade-in-scale origin-top-left">
        <div className="space-y-3">
            <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 block">Align</label>
                <div className="grid grid-cols-3 gap-1 bg-[var(--color-background)] p-1 rounded-md">
                   <button onClick={() => alignSelectedObjects('x', 'min')} title="Align Min X" className="p-1.5 rounded hover:bg-[var(--color-border)] flex justify-center text-red-400"><AlignMinIcon className="w-5 h-5" /></button>
                   <button onClick={() => alignSelectedObjects('x', 'center')} title="Align Center X" className="p-1.5 rounded hover:bg-[var(--color-border)] flex justify-center text-red-400"><AlignCenterIcon className="w-5 h-5" /></button>
                   <button onClick={() => alignSelectedObjects('x', 'max')} title="Align Max X" className="p-1.5 rounded hover:bg-[var(--color-border)] flex justify-center text-red-400"><AlignMaxIcon className="w-5 h-5" /></button>
                   
                   <button onClick={() => alignSelectedObjects('y', 'min')} title="Align Min Y" className="p-1.5 rounded hover:bg-[var(--color-border)] flex justify-center text-green-400"><AlignMinIcon className="w-5 h-5 transform -rotate-90" /></button>
                   <button onClick={() => alignSelectedObjects('y', 'center')} title="Align Center Y" className="p-1.5 rounded hover:bg-[var(--color-border)] flex justify-center text-green-400"><AlignCenterIcon className="w-5 h-5 transform -rotate-90" /></button>
                   <button onClick={() => alignSelectedObjects('y', 'max')} title="Align Max Y" className="p-1.5 rounded hover:bg-[var(--color-border)] flex justify-center text-green-400"><AlignMaxIcon className="w-5 h-5 transform -rotate-90" /></button>

                   <button onClick={() => alignSelectedObjects('z', 'min')} title="Align Min Z" className="p-1.5 rounded hover:bg-[var(--color-border)] flex justify-center text-blue-400"><AlignMinIcon className="w-5 h-5" /></button>
                   <button onClick={() => alignSelectedObjects('z', 'center')} title="Align Center Z" className="p-1.5 rounded hover:bg-[var(--color-border)] flex justify-center text-blue-400"><AlignCenterIcon className="w-5 h-5" /></button>
                   <button onClick={() => alignSelectedObjects('z', 'max')} title="Align Max Z" className="p-1.5 rounded hover:bg-[var(--color-border)] flex justify-center text-blue-400"><AlignMaxIcon className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 block">Distribute</label>
                     <div className="grid grid-cols-3 gap-1 bg-[var(--color-background)] p-1 rounded-md">
                         <button onClick={() => distributeSelectedObjects('x')} disabled={!canDistribute} title="Distribute X" className="p-1 rounded hover:bg-[var(--color-border)] flex justify-center text-red-400 disabled:opacity-30 disabled:hover:bg-transparent"><DistributeHorizontalIcon className="w-4 h-4"/></button>
                         <button onClick={() => distributeSelectedObjects('y')} disabled={!canDistribute} title="Distribute Y" className="p-1 rounded hover:bg-[var(--color-border)] flex justify-center text-green-400 disabled:opacity-30 disabled:hover:bg-transparent"><DistributeVerticalIcon className="w-4 h-4"/></button>
                         <button onClick={() => distributeSelectedObjects('z')} disabled={!canDistribute} title="Distribute Z" className="p-1 rounded hover:bg-[var(--color-border)] flex justify-center text-blue-400 disabled:opacity-30 disabled:hover:bg-transparent"><DistributeHorizontalIcon className="w-4 h-4"/></button>
                     </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 block">Mirror</label>
                     <div className="grid grid-cols-3 gap-1 bg-[var(--color-background)] p-1 rounded-md">
                         <button onClick={() => mirrorSelectedObjects('x')} title="Mirror X" className="p-1 rounded hover:bg-[var(--color-border)] flex justify-center text-red-400"><MirrorIcon className="w-4 h-4"/></button>
                         <button onClick={() => mirrorSelectedObjects('y')} title="Mirror Y" className="p-1 rounded hover:bg-[var(--color-border)] flex justify-center text-green-400"><MirrorIcon className="w-4 h-4 transform -rotate-90"/></button>
                         <button onClick={() => mirrorSelectedObjects('z')} title="Mirror Z" className="p-1 rounded hover:bg-[var(--color-border)] flex justify-center text-blue-400"><MirrorIcon className="w-4 h-4"/></button>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};


/**
 * A floating toolbar in the viewport for controlling gizmo behavior and camera actions.
 */
const GizmoToolbar: React.FC = () => {
  const { 
    isSnappingEnabled, toggleSnapping, 
    gizmoMode, setGizmoMode, 
    selectedObjectIds,
    isFocusModeActive, toggleFocusMode,
    cameraProjection, toggleCameraProjection,
    isMeasureModeActive, toggleMeasureMode,
    groupSelectedObjects, ungroupSelectedObjects, objects
  } = useStore();
  const [isArrangeFlyoutOpen, setIsArrangeFlyoutOpen] = useState(false);
  const arrangeFlyoutRef = useRef<HTMLDivElement>(null);

  const isPerspective = cameraProjection === 'perspective';
  const canGroup = selectedObjectIds.length >= 2;
  const canUngroup = selectedObjectIds.some(id => objects[id]?.type === 'group');
  const canArrange = selectedObjectIds.length >= 2;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
       if (arrangeFlyoutRef.current && !arrangeFlyoutRef.current.contains(event.target as Node)) {
        setIsArrangeFlyoutOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-1 p-1 bg-[var(--color-panel)]/50 backdrop-blur-md border border-white/10 rounded-xl shadow-lg animate-slide-in-from-left">
      <div className="flex items-center">
        <ToolButton label="Move (T)" isActive={gizmoMode === 'translate' && !isMeasureModeActive} onClick={() => setGizmoMode('translate')}>
          <MoveIcon className="w-5 h-5" />
        </ToolButton>
        <ToolButton label="Rotate (R)" isActive={gizmoMode === 'rotate' && !isMeasureModeActive} onClick={() => setGizmoMode('rotate')}>
          <RotateIcon className="w-5 h-5" />
        </ToolButton>
        <ToolButton label="Scale (S)" isActive={gizmoMode === 'scale' && !isMeasureModeActive} onClick={() => setGizmoMode('scale')}>
          <ScaleIcon className="w-5 h-5" />
        </ToolButton>
      </div>
      <div className="w-px h-6 bg-white/10 mx-1"></div>

      <div className="flex items-center">
        <ToolButton label="Group" disabled={!canGroup} onClick={groupSelectedObjects}>
            <GroupIcon className="w-5 h-5" />
        </ToolButton>
        <ToolButton label="Ungroup" disabled={!canUngroup} onClick={ungroupSelectedObjects}>
            <UngroupIcon className="w-5 h-5" />
        </ToolButton>
        <div className="relative" ref={arrangeFlyoutRef}>
            <ToolButton label="Arrange" disabled={!canArrange} isActive={isArrangeFlyoutOpen} onClick={() => setIsArrangeFlyoutOpen(prev => !prev)}>
                <ArrangeIcon className="w-5 h-5" />
            </ToolButton>
            {isArrangeFlyoutOpen && <ArrangeFlyout />}
        </div>
      </div>
      <div className="w-px h-6 bg-white/10 mx-1"></div>
      
      <div className="flex items-center">
        <ToolButton label="Measure (M)" isActive={isMeasureModeActive} onClick={toggleMeasureMode}>
          <MeasureIcon className="w-5 h-5" />
        </ToolButton>
        <ToolButton label={`Toggle Snapping (${isSnappingEnabled ? 'On' : 'Off'})`} isActive={isSnappingEnabled} onClick={toggleSnapping}>
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
        <ToolButton onClick={toggleCameraProjection} label={`Switch to ${isPerspective ? 'Orthographic' : 'Perspective'} View`} >
          {isPerspective ? <PerspectiveIcon className="w-5 h-5" /> : <OrthoIcon className="w-5 h-5" />}
        </ToolButton>
      </div>
    </div>
  );
};

export default GizmoToolbar;