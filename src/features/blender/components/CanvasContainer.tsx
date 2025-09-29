import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import GizmoToolbar from './GizmoToolbar';

/**
 * A rebuilt container for the 3D canvas, ensuring a professional presentation.
 * It provides a clean loading state and sets up the core rendering environment.
 */
const CanvasContainer: React.FC = () => {
  return (
    <div className="h-full w-full bg-[#252526] relative">
       <Suspense fallback={<div className="flex h-full w-full items-center justify-center text-gray-400 font-medium">Loading Scene...</div>}>
          <GizmoToolbar />
          <Canvas 
            shadows 
            camera={{ position: [8, 8, 12], fov: 50 }}
            dpr={[1, 2]} // Use device pixel ratio for sharp rendering, capped at 2x
          >
            <Scene />
          </Canvas>
      </Suspense>
    </div>
  );
};

export default CanvasContainer;