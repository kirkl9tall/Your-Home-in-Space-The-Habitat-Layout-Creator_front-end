/**
 * Blender Model API Integration Service
 * This service interfaces with your Blender API to load custom 3D models
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Configuration for your Blender API
const BLENDER_API_CONFIG = {
  // Replace with your actual API base URL - using Vite env variables
  baseUrl: import.meta.env.VITE_BLENDER_API_URL || 'http://localhost:8000/api/v1',
  endpoints: {
    modules: '/models/modules',
    download: '/models/download'
  }
};

// Model cache to avoid re-downloading
const modelCache = new Map<string, THREE.Group>();
const loaderCache = new Map<string, Promise<THREE.Group>>();

// Available module types that can be generated in Blender
export interface BlenderModuleRequest {
  moduleType: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  details?: {
    dockingPorts?: number;
    windows?: number;
    equipment?: string[];
    materialType?: 'metal' | 'composite' | 'glass';
  };
  format?: 'gltf' | 'glb' | 'obj' | 'fbx';
}

export interface BlenderModuleResponse {
  id: string;
  moduleType: string;
  downloadUrl: string;
  format: string;
  fileSize: number;
  generatedAt: string;
  metadata: {
    vertices: number;
    faces: number;
    materials: number;
  };
}

class BlenderModelService {
  private gltfLoader: GLTFLoader;

  constructor() {
    this.gltfLoader = new GLTFLoader();
  }

  /**
   * Request a custom module from your Blender API
   */
  async requestModule(request: BlenderModuleRequest): Promise<BlenderModuleResponse> {
    try {
      const response = await fetch(`${BLENDER_API_CONFIG.baseUrl}${BLENDER_API_CONFIG.endpoints.modules}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Blender API request failed: ${response.statusText}`);
      }

      const result: BlenderModuleResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to request module from Blender API:', error);
      throw error;
    }
  }

  /**
   * Load a 3D model from URL into Three.js
   */
  async loadModel(downloadUrl: string, format: string = 'gltf'): Promise<THREE.Group> {
    const cacheKey = downloadUrl;
    
    // Check cache first
    if (modelCache.has(cacheKey)) {
      return modelCache.get(cacheKey)!.clone();
    }

    // Check if already loading
    if (loaderCache.has(cacheKey)) {
      const model = await loaderCache.get(cacheKey)!;
      return model.clone();
    }

    // Start loading
    const loadPromise = this.loadModelInternal(downloadUrl, format);
    loaderCache.set(cacheKey, loadPromise);

    try {
      const model = await loadPromise;
      modelCache.set(cacheKey, model);
      return model.clone();
    } catch (error) {
      loaderCache.delete(cacheKey);
      throw error;
    }
  }

  private async loadModelInternal(downloadUrl: string, format: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      switch (format.toLowerCase()) {
        case 'gltf':
        case 'glb':
          this.gltfLoader.load(
            downloadUrl,
            (gltf) => {
              const model = gltf.scene;
              this.optimizeModel(model);
              resolve(model);
            },
            (progress) => {
              console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
            },
            (error) => {
              console.error('Error loading GLTF model:', error);
              reject(error);
            }
          );
          break;
        
        // Add support for other formats as needed
        case 'obj':
          // Implement OBJ loader
          reject(new Error('OBJ format not yet implemented'));
          break;
        
        case 'fbx':
          // Implement FBX loader
          reject(new Error('FBX format not yet implemented'));
          break;
        
        default:
          reject(new Error(`Unsupported format: ${format}`));
      }
    });
  }

  /**
   * Optimize the loaded model for better performance
   */
  private optimizeModel(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Enable frustum culling
        child.frustumCulled = true;
        
        // Optimize materials
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => this.optimizeMaterial(mat));
          } else {
            this.optimizeMaterial(child.material);
          }
        }
        
        // Merge geometries if possible
        if (child.geometry) {
          child.geometry.computeBoundingBox();
          child.geometry.computeBoundingSphere();
        }
      }
    });
  }

  private optimizeMaterial(material: THREE.Material): void {
    if (material instanceof THREE.MeshStandardMaterial || 
        material instanceof THREE.MeshPhysicalMaterial) {
      // Enable material optimizations
      material.needsUpdate = false;
    }
  }

  /**
   * Generate a module with your Blender API and load it
   */
  async generateAndLoadModule(
    moduleType: string, 
    dimensions: { width: number; height: number; depth: number }
  ): Promise<THREE.Group> {
    try {
      // Request module generation
      const moduleRequest: BlenderModuleRequest = {
        moduleType,
        dimensions,
        format: 'gltf',
        details: this.getModuleDetails(moduleType)
      };

      console.log(`Requesting ${moduleType} module from Blender API...`);
      const response = await this.requestModule(moduleRequest);
      
      console.log(`Loading generated model: ${response.downloadUrl}`);
      const model = await this.loadModel(response.downloadUrl, response.format);
      
      // Scale model to match dimensions
      this.scaleModelToDimensions(model, dimensions);
      
      return model;
    } catch (error) {
      console.error(`Failed to generate and load ${moduleType} module:`, error);
      throw error;
    }
  }

  /**
   * Get appropriate details for different module types
   */
  private getModuleDetails(moduleType: string): BlenderModuleRequest['details'] {
    const details: Record<string, BlenderModuleRequest['details']> = {
      'CREW_SLEEP': {
        dockingPorts: 1,
        windows: 2,
        equipment: ['bed', 'storage', 'air_vent'],
        materialType: 'composite'
      },
      'HYGIENE': {
        dockingPorts: 1,
        equipment: ['shower', 'sink', 'waste_system'],
        materialType: 'metal'
      },
      'EXERCISE': {
        dockingPorts: 2,
        windows: 4,
        equipment: ['treadmill', 'bike', 'resistance_machine'],
        materialType: 'composite'
      },
      'FOOD_PREP': {
        dockingPorts: 1,
        equipment: ['oven', 'storage', 'prep_surface'],
        materialType: 'metal'
      },
      'MEDICAL': {
        dockingPorts: 1,
        windows: 2,
        equipment: ['exam_table', 'equipment_rack', 'storage'],
        materialType: 'composite'
      },
      'AIRLOCK': {
        dockingPorts: 2,
        windows: 1,
        equipment: ['pressure_system', 'suit_storage'],
        materialType: 'metal'
      }
    };

    return details[moduleType] || { dockingPorts: 1, materialType: 'composite' };
  }

  /**
   * Scale the loaded model to match the required dimensions
   */
  private scaleModelToDimensions(
    model: THREE.Group, 
    targetDimensions: { width: number; height: number; depth: number }
  ): void {
    const box = new THREE.Box3().setFromObject(model);
    const currentSize = box.getSize(new THREE.Vector3());
    
    const scaleX = targetDimensions.width / currentSize.x;
    const scaleY = targetDimensions.height / currentSize.y;
    const scaleZ = targetDimensions.depth / currentSize.z;
    
    // Use uniform scaling to maintain proportions
    const uniformScale = Math.min(scaleX, scaleY, scaleZ);
    model.scale.set(uniformScale, uniformScale, uniformScale);
  }

  /**
   * Clear the model cache
   */
  clearCache(): void {
    modelCache.clear();
    loaderCache.clear();
  }
}

export const blenderModelService = new BlenderModelService();
export default blenderModelService;