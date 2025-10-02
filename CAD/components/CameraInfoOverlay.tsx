import React, { useState, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { CameraControls as CameraControlsImpl } from 'three-stdlib';
import useStore from '../store/useStore';
import { CameraIcon, CloseIcon } from './icons';

// A compact numeric input for the overlay
const NumericInput: React.FC<{
  label: string;
  value: number;
  onCommit: (newValue: number) => void;
  onFocus: () => void;
  onBlur: () => void;
}> = ({ label, value, onCommit, onFocus, onBlur }) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Only update from external state if not focused
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value.toString());
    }
  }, [value]);

  const handleBlur = () => {
    const num = parseFloat(localValue);
    if (!isNaN(num)) {
      onCommit(num);
    } else {
      // Revert if invalid input
      setLocalValue(value.toString());
    }
    onBlur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setLocalValue(value.toString());
      setTimeout(() => inputRef.current?.blur(), 0);
    }
  };

  return (
    <div className="relative flex items-center h-6">
      <span className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-5 text-xs font-mono select-none bg-black/20 rounded-l-md border-r border-[var(--color-border)]">
        {label}
      </span>
      <input
        ref={inputRef}
        type="number"
        step={0.1}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={onFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md pl-6 pr-1 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition font-mono"
      />
    </div>
  );
};

interface CameraInfoOverlayProps {
    onClose: () => void;
    toolbarWidth: string;
}

const CameraInfoOverlay: React.FC<CameraInfoOverlayProps> = ({ onClose, toolbarWidth }) => {
    const { camera, controls } = useThree();
    const cameraControls = controls as CameraControlsImpl | null;
    const cameraProjection = useStore(s => s.cameraProjection);
    
    const [isEditing, setIsEditing] = useState(false);
    const [display, setDisplay] = useState({
        pos: [0, 0, 0],
        rot: [0, 0, 0], // polar, azimuth, roll in degrees
        dist: 0,
        zoom: 1,
    });

    useFrame(() => {
        if (!cameraControls || isEditing) return;

        const pos = new THREE.Vector3();
        cameraControls.getPosition(pos);
        
        const polar = THREE.MathUtils.radToDeg(cameraControls.polarAngle);
        const azimuth = THREE.MathUtils.radToDeg(cameraControls.azimuthAngle);
        const roll = THREE.MathUtils.radToDeg(cameraControls.rollAngle);
        
        const dist = cameraControls.distance;
        const zoom = (camera as THREE.OrthographicCamera).zoom || 1;
        
        setDisplay({
            pos: [parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))],
            rot: [parseFloat(polar.toFixed(1)), parseFloat(azimuth.toFixed(1)), parseFloat(roll.toFixed(1))],
            dist: parseFloat(dist.toFixed(2)),
            zoom: parseFloat(zoom.toFixed(2)),
        });
    });

    const handlePosChange = (axis: number, value: number) => {
      if (!cameraControls || isNaN(value)) return;
      const newPos = new THREE.Vector3().fromArray(display.pos);
      newPos.setComponent(axis, value);
      cameraControls.setPosition(newPos.x, newPos.y, newPos.z, true);
    };
    
    const handleRotChange = (axis: 'p' | 'a' | 'r', value: number) => {
        if (!cameraControls || isNaN(value)) return;
        const radValue = THREE.MathUtils.degToRad(value);
        const { azimuthAngle, polarAngle, rollAngle } = cameraControls;
        if (axis === 'p') {
            cameraControls.rotateTo(azimuthAngle, radValue, true);
        } else if (axis === 'a') {
            cameraControls.rotateTo(radValue, polarAngle, true);
        } else if (axis === 'r') {
            // The `rollTo` method is not available in some versions,
            // so we calculate the delta and use the `roll` method instead.
            const deltaRoll = radValue - rollAngle;
            cameraControls.roll(deltaRoll, true);
        }
    };

    const handleDistChange = (value: number) => {
        if (!cameraControls || isNaN(value)) return;
        cameraControls.dollyTo(value, true);
    };

    const handleZoomChange = (value: number) => {
        if (!(camera instanceof THREE.OrthographicCamera) || isNaN(value) || value <= 0) return;
        // camera-controls has `zoom(zoomStep, enableTransition)`. The `zoomStep` is a multiplier.
        cameraControls.zoom(value / camera.zoom, false);
    };

    const portalContainer = useRef(document.body);

    return (
        <Html fullscreen portal={portalContainer} style={{ pointerEvents: 'none' }}>
            <div 
                className="fixed bottom-24 animate-fade-in-scale origin-bottom-left" 
                style={{
                    pointerEvents: 'auto',
                    left: `calc(${toolbarWidth} + 1rem)`,
                    transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-64 p-2.5 rounded-lg bg-[var(--color-panel)]/80 backdrop-blur-md border border-white/10 shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
                            <CameraIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                            Camera Details
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="p-1.5 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-panel-light)] hover:text-white transition-colors"
                            aria-label="Close camera controls"
                        >
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-2">
                        <div>
                        <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">Position (X, Y, Z)</label>
                        <div className="grid grid-cols-3 gap-1">
                            <NumericInput label="X" value={display.pos[0]} onCommit={(v) => handlePosChange(0, v)} onFocus={() => setIsEditing(true)} onBlur={() => setIsEditing(false)} />
                            <NumericInput label="Y" value={display.pos[1]} onCommit={(v) => handlePosChange(1, v)} onFocus={() => setIsEditing(true)} onBlur={() => setIsEditing(false)} />
                            <NumericInput label="Z" value={display.pos[2]} onCommit={(v) => handlePosChange(2, v)} onFocus={() => setIsEditing(true)} onBlur={() => setIsEditing(false)} />
                        </div>
                        </div>
                        <div>
                        <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">Rotation (Polar, Azimuth, Roll)</label>
                        <div className="grid grid-cols-3 gap-1">
                            <NumericInput label="P" value={display.rot[0]} onCommit={(v) => handleRotChange('p', v)} onFocus={() => setIsEditing(true)} onBlur={() => setIsEditing(false)} />
                            <NumericInput label="A" value={display.rot[1]} onCommit={(v) => handleRotChange('a', v)} onFocus={() => setIsEditing(true)} onBlur={() => setIsEditing(false)} />
                            <NumericInput label="R" value={display.rot[2]} onCommit={(v) => handleRotChange('r', v)} onFocus={() => setIsEditing(true)} onBlur={() => setIsEditing(false)} />
                        </div>
                        </div>
                        {cameraProjection === 'perspective' ? (
                        <div>
                            <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">Distance</label>
                            <NumericInput label="D" value={display.dist} onCommit={handleDistChange} onFocus={() => setIsEditing(true)} onBlur={() => setIsEditing(false)} />
                        </div>
                        ) : (
                        <div>
                            <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">Zoom</label>
                            <NumericInput label="Z" value={display.zoom} onCommit={handleZoomChange} onFocus={() => setIsEditing(true)} onBlur={() => setIsEditing(false)} />
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </Html>
    );
};

export default CameraInfoOverlay;