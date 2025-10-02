import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import GizmoToolbar from './GizmoToolbar';
import useStore from '../store/useStore';

interface CanvasContainerProps {
  isCameraInfoOpen: boolean;
  setCameraInfoOpen: (isOpen: boolean) => void;
  inspectorWidth: string;
  toolbarWidth: string;
}

/**
 * A rebuilt container for the 3D canvas, ensuring a professional presentation.
 * It provides a clean loading state and sets up the core rendering environment.
 */
const CanvasContainer: React.FC<CanvasContainerProps> = ({ isCameraInfoOpen, setCameraInfoOpen, inspectorWidth, toolbarWidth }) => {
  const creationMode = useStore(state => state.creationState.shapeType);
  const isMeasureMode = useStore(state => state.isMeasureModeActive);
  const dpr = useStore(state => state.renderQuality.dpr);

  const getCursor = () => {
    if (creationMode) return 'crosshair';
    if (isMeasureMode) return 'crosshair';
    return 'default';
  }

  return (
    <div 
      className="h-full w-full bg-[var(--color-background)] relative"
      style={{ cursor: getCursor() }}
    >
       <Suspense fallback={<div className="flex h-full w-full items-center justify-center text-[var(--color-text-secondary)] font-medium">Loading Scene...</div>}>
          <GizmoToolbar />
          <Canvas 
            shadows 
            dpr={[1, dpr]} // Use device pixel ratio for sharp rendering, capped at 2x
          >
            <Scene isCameraInfoOpen={isCameraInfoOpen} setCameraInfoOpen={setCameraInfoOpen} inspectorWidth={inspectorWidth} toolbarWidth={toolbarWidth} />
          </Canvas>
      </Suspense>
    </div>
  );
};

export default CanvasContainer;