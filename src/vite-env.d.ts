/// <reference types="vite/client" />

declare module '3d-tiles-renderer' {
  import * as THREE from 'three';

  export class TilesRenderer extends THREE.EventDispatcher {
    constructor(url: string);
    
    group: THREE.Group;
    lruCache: {
      minSize: number;
      maxSize: number;
    };
    errorTarget: number;
    
    setCamera(camera: THREE.Camera): void;
    setResolutionFromRenderer(camera: THREE.Camera, renderer: THREE.WebGLRenderer): void;
    getBoundingSphere(sphere: THREE.Sphere): void;
    getBoundingBox(box: THREE.Box3): void;
    update(): void;
    dispose(): void;
    
    addEventListener(type: string, listener: (event: any) => void): void;
    removeEventListener(type: string, listener: (event: any) => void): void;
  }

  export namespace TilesRenderer {
    interface Plugin {
      name: string;
    }
  }
}

declare module '3d-tiles-renderer/plugins' {
  export class TilesFadePlugin {
    constructor();
  }
  
  export class GLTFExtensionsPlugin {
    constructor();
  }
}