

import { create } from 'zustand';
import { SceneObject, ShapeType, GizmoMode, Measurement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';
import { toast } from '../components/Toast';

type HistoryState = Pick<AppState, 'objects' | 'selectedObjectIds'>;

// --- UTILITY FUNCTIONS ---
/**
 * Recursively calculates the world matrix for a scene object.
 * @param object - The scene object.
 * @param objects - The record of all scene objects.
 * @returns The world matrix of the object.
 */
const getObjectWorldMatrix = (object: SceneObject, objects: Record<string, SceneObject>): THREE.Matrix4 => {
    const position = new THREE.Vector3().fromArray(object.position);
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler().fromArray(object.rotation));
    const scale = new THREE.Vector3().fromArray(object.scale);
    const localMatrix = new THREE.Matrix4().compose(position, quaternion, scale);

    if (object.parentId && objects[object.parentId]) {
        const parentMatrix = getObjectWorldMatrix(objects[object.parentId], objects);
        return new THREE.Matrix4().multiplyMatrices(parentMatrix, localMatrix);
    } else {
        return localMatrix;
    }
};

/**
 * Calculates the world-space bounding box of a scene object, assuming unit geometry.
 * @param object - The scene object.
 * @param objects - The record of all scene objects.
 * @returns The world-space THREE.Box3 bounding box.
 */
const getObjectWorldBoundingBox = (object: SceneObject, objects: Record<string, SceneObject>): THREE.Box3 => {
    const worldMatrix = getObjectWorldMatrix(object, objects);
    // Assuming unit geometry centered at origin (size 1x1x1)
    const unitBox = new THREE.Box3(
        new THREE.Vector3(-0.5, -0.5, -0.5),
        new THREE.Vector3(0.5, 0.5, 0.5)
    );
    return unitBox.applyMatrix4(worldMatrix);
};


/**
 * Defines the shape of the application's state.
 */
interface AppState {
  objects: Record<string, SceneObject>;
  selectedObjectIds: string[];
  isSnappingEnabled: boolean;
  gizmoMode: GizmoMode;
  isFocusModeActive: boolean;
  cameraProjection: 'perspective' | 'orthographic';
  snapIncrement: {
    translate: number;
    scale: number;
    rotate: number; // In degrees
  };
  dragState: {
    isDragging: boolean;
    objectId: string | null;
    plane: THREE.Plane | null;
    startPoint: THREE.Vector3 | null;
    startObjectPosition: THREE.Vector3 | null;
  };
  loadingState: {
    isLoading: boolean;
    message: string;
  };
  creationState: {
    shapeType: ShapeType | null;
  };
  exportRequest: 'glb' | null;
  history: HistoryState[];
  historyIndex: number;
  renderQuality: {
    shadowMapSize: number;
    dpr: number;
  };
  isMeasureModeActive: boolean;
  measurements: Measurement[];
  currentMeasurement: {
    start: [number, number, number] | null;
    end: [number, number, number] | null;
  };
  isGridVisible: boolean;
  gridConfig: {
    cellSize: number;
    sectionSize: number;
    fadeDistance: number;
  };
  isInspectorCollapsed: boolean;
  isToolbarCollapsed: boolean;
  addObject: (type: ShapeType, position?: [number, number, number]) => string;
  addImportedObject: (data: { modelUrl: string; fileMap?: Record<string, string> }) => void;
  addSvgObject: (svgData: string, name: string) => void;
  setSelectedObjectIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  updateObject: (id: string, newProps: Partial<SceneObject>, skipHistory?: boolean) => void;
  updateObjects: (updates: { id: string, newProps: Partial<SceneObject> }[], skipHistory?: boolean) => void;
  removeObject: (id: string) => void;
  removeSelectedObjects: () => void;
  duplicateSelectedObjects: () => void;
  groupSelectedObjects: () => void;
  ungroupSelectedObjects: () => void;
  alignSelectedObjects: (axis: 'x' | 'y' | 'z', edge: 'min' | 'center' | 'max') => void;
  distributeSelectedObjects: (axis: 'x' | 'y' | 'z') => void;
  mirrorSelectedObjects: (axis: 'x' | 'y' | 'z') => void;
  toggleObjectProperty: (id: string, property: 'isVisible' | 'isLocked') => void;
  toggleSnapping: () => void;
  setGizmoMode: (mode: GizmoMode) => void;
  toggleFocusMode: () => void;
  setFocusMode: (isActive: boolean) => void;
  toggleCameraProjection: () => void;
  setCreationMode: (shapeType: ShapeType | null) => void;
  startDrag: (objectId: string, intersectionPoint: THREE.Vector3) => void;
  endDrag: () => void;
  undo: () => void;
  redo: () => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  saveScene: () => void;
  loadScene: (file: File) => void;
  setExportRequest: (format: 'glb' | null) => void;
  setRenderQuality: (quality: Partial<AppState['renderQuality']>) => void;
  toggleMeasureMode: () => void;
  startOrEndMeasurement: (point: [number, number, number]) => void;
  updateCurrentMeasurementEnd: (point: [number, number, number] | null) => void;
  cancelCurrentMeasurement: () => void;
  clearAllMeasurements: () => void;
  toggleGridVisibility: () => void;
  setGridConfig: (config: Partial<AppState['gridConfig']>) => void;
  toggleInspector: () => void;
  toggleToolbar: () => void;
}

const cleanupObjectUrls = (object: SceneObject) => {
  if (object.type === 'model') {
    if (object.modelUrl && object.modelUrl.startsWith('blob:')) {
      URL.revokeObjectURL(object.modelUrl);
    }
    if (object.fileMap) {
      Object.values(object.fileMap).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    }
  }
};

const useStore = create<AppState>((set, get) => {
  const setWithHistory = (updater: (state: AppState) => Partial<AppState>) => {
    set(state => {
        const updatedProps = updater(state);
        const newState = { ...state, ...updatedProps };
        const historySnapshot: HistoryState = { objects: newState.objects, selectedObjectIds: newState.selectedObjectIds };
        
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(historySnapshot);
        
        return {
            ...updatedProps,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        };
    });
  };

  return {
    objects: {},
    selectedObjectIds: [],
    isSnappingEnabled: false,
    gizmoMode: 'translate',
    isFocusModeActive: false,
    cameraProjection: 'perspective',
    snapIncrement: {
      translate: 0.25,
      scale: 0.1,
      rotate: 15,
    },
    dragState: {
      isDragging: false,
      objectId: null,
      plane: null,
      startPoint: null,
      startObjectPosition: null,
    },
    loadingState: {
      isLoading: false,
      message: '',
    },
    creationState: {
        shapeType: null,
    },
    exportRequest: null,
    history: [{ objects: {}, selectedObjectIds: [] }],
    historyIndex: 0,
    renderQuality: {
      shadowMapSize: 2048,
      dpr: 2,
    },
    isMeasureModeActive: false,
    measurements: [],
    currentMeasurement: { start: null, end: null },
    isGridVisible: true,
    gridConfig: {
        cellSize: 1,
        sectionSize: 10,
        fadeDistance: 50,
    },
    isInspectorCollapsed: false,
    isToolbarCollapsed: false,

    setLoading: (isLoading: boolean, message = '') => set({ loadingState: { isLoading, message } }),
    
    setCreationMode: (shapeType: ShapeType | null) => set(state => ({ 
        creationState: { shapeType },
        isMeasureModeActive: shapeType ? false : state.isMeasureModeActive,
    })),
    
    setExportRequest: (format: 'glb' | null) => set({ exportRequest: format }),

    setRenderQuality: (quality) => set(state => ({
        renderQuality: { ...state.renderQuality, ...quality },
    })),

    addObject: (type: ShapeType, position?: [number, number, number]) => {
      const newId = uuidv4();
      setWithHistory((state) => {
        const { snapIncrement } = state;
        const snap = snapIncrement.translate;
        
        let initialY = 0.5;
        let scale: [number, number, number] = [1, 1, 1];
        let rotation: [number, number, number] = [0, 0, 0];
        
        switch (type) {
            case 'sphere': case 'capsule': initialY = 0.5; break;
            case 'cylinder': case 'cone': initialY = 0.5; break;
            case 'torus': initialY = 0.2; break;
            case 'plane': initialY = 0; scale = [1, 1, 1]; rotation = [-Math.PI / 2, 0, 0]; break;
            case 'pyramid': initialY = 0.5; break;
            case 'gear': initialY = 0.125; break;
            case 'text': case 'star': case 'heart': initialY = 0.1; rotation = [-Math.PI / 2, 0, 0]; break;
        }

        const newPosition: [number, number, number] = position 
            ? [position[0], type.match(/^(plane|text|star|heart)$/) ? 0.01 : initialY, position[2]]
            : [
                Math.round((Math.random() * 4 - 2) / snap) * snap,
                type.match(/^(plane|text|star|heart)$/) ? 0.01 : initialY,
                Math.round((Math.random() * 4 - 2) / snap) * snap
            ];
        
        const newObject: SceneObject = {
          id: newId,
          type,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
          position: newPosition,
          rotation,
          scale,
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
          metalness: 0.2,
          roughness: 0.4,
          opacity: 1,
          transparent: false,
          emissiveColor: '#000000',
          emissiveIntensity: 0,
          wireframe: false,
          isVisible: true,
          isLocked: false,
          ...(type === 'text' && { text: 'Hello', extrusionDepth: 0.2 }),
          ...(type === 'star' && { starConfig: { points: 5, innerRadius: 0.4, outerRadius: 1 }, extrusionDepth: 0.2 }),
          ...(type === 'heart' && { extrusionDepth: 0.2 }),
          ...(type === 'gear' && { extrusionDepth: 0.25 }),
        };
        return { 
            objects: {...state.objects, [newObject.id]: newObject },
            selectedObjectIds: [newObject.id]
        };
      });
      return newId;
    },
    
    addImportedObject: (data: { modelUrl: string; fileMap?: Record<string, string> }) => {
      setWithHistory((state) => {
        const { snapIncrement } = state;
        const snap = snapIncrement.translate;
        const newObject: SceneObject = {
          id: uuidv4(),
          type: 'model',
          name: 'Imported Model',
          modelUrl: data.modelUrl,
          fileMap: data.fileMap,
          position: [
            Math.round((Math.random() * 4 - 2) / snap) * snap,
            0,
            Math.round((Math.random() * 4 - 2) / snap) * snap
          ],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
          metalness: 0.2,
          roughness: 0.4,
          opacity: 1,
          transparent: false,
          emissiveColor: '#000000',
          emissiveIntensity: 0,
          wireframe: false,
          isVisible: true,
          isLocked: false,
        };
        return { 
            objects: {...state.objects, [newObject.id]: newObject },
            selectedObjectIds: [newObject.id]
        };
      });
    },

    addSvgObject: (svgData: string, name: string) => {
        setWithHistory((state) => {
            const newObject: SceneObject = {
                id: uuidv4(),
                type: 'svg',
                name: name || 'SVG',
                svgData,
                extrusionDepth: 0.2,
                position: [0, 0.1, 0],
                rotation: [-Math.PI / 2, 0, 0],
                scale: [0.1, 0.1, 0.1],
                color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
                metalness: 0.2,
                roughness: 0.4,
                opacity: 1,
                transparent: false,
                emissiveColor: '#000000',
                emissiveIntensity: 0,
                wireframe: false,
                isVisible: true,
                isLocked: false,
            };
            return {
                objects: { ...state.objects, [newObject.id]: newObject },
                selectedObjectIds: [newObject.id],
            };
        });
    },

    setSelectedObjectIds: (ids: string[]) => {
      set(state => {
        const newSelectedIds = ids.filter(id => !state.objects[id]?.isLocked);
        if (newSelectedIds.length === 0 && state.isFocusModeActive) {
          return { selectedObjectIds: newSelectedIds, isFocusModeActive: false };
        }
        return { selectedObjectIds: newSelectedIds };
      });
    },
    
    addToSelection: (id: string) => {
      set((state) => {
        if (state.objects[id]?.isLocked) return {};
        const newSelection = new Set(state.selectedObjectIds);
        newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
        const newSelectedIds = Array.from(newSelection);

        if (newSelectedIds.length === 0 && state.isFocusModeActive) {
          return { selectedObjectIds: newSelectedIds, isFocusModeActive: false };
        }
        return { selectedObjectIds: newSelectedIds };
      });
    },

    updateObject: (id: string, newProps: Partial<SceneObject>, skipHistory = false) => {
      const updater = (state: AppState) => ({
        objects: { ...state.objects, [id]: { ...state.objects[id], ...newProps } },
      });
      if (skipHistory) set(updater);
      else setWithHistory(updater);
    },

    updateObjects: (updates: { id: string, newProps: Partial<SceneObject> }[], skipHistory = false) => {
      const updater = (state: AppState) => {
        const newObjects = { ...state.objects };
        updates.forEach(({ id, newProps }) => {
            if(newObjects[id]) {
                newObjects[id] = { ...newObjects[id], ...newProps };
            }
        });
        return { objects: newObjects };
      };
      if (skipHistory) set(updater);
      else setWithHistory(updater);
    },
    
    removeObject: (id: string) => {
      const objectToRemove = get().objects[id];
      if (objectToRemove) cleanupObjectUrls(objectToRemove);

      setWithHistory((state) => {
        const newObjects = { ...state.objects };
        delete newObjects[id];
        return {
            objects: newObjects,
            selectedObjectIds: state.selectedObjectIds.filter(selectedId => selectedId !== id),
        }
      });
    },

    removeSelectedObjects: () => {
      const { selectedObjectIds } = get();
      if (selectedObjectIds.length === 0) return;

      setWithHistory((state) => {
        const newObjects = { ...state.objects };
        const allIdsToRemove = new Set<string>();
        const queue = [...selectedObjectIds];

        while(queue.length > 0) {
          const id = queue.shift()!;
          if (!allIdsToRemove.has(id) && newObjects[id]) {
            allIdsToRemove.add(id);
            Object.values(newObjects).forEach(o => {
                if (o.parentId === id) queue.push(o.id);
            });
          }
        }
        
        allIdsToRemove.forEach(id => {
            cleanupObjectUrls(newObjects[id]);
            delete newObjects[id];
        });

        return {
          objects: newObjects,
          selectedObjectIds: [],
          isFocusModeActive: false,
        };
      });
    },

    duplicateSelectedObjects: () => {
      const { selectedObjectIds } = get();
      if (selectedObjectIds.length === 0) return;
      setWithHistory(state => {
        const { objects, snapIncrement } = state;
        const snap = snapIncrement.translate;
        const newObjects: Record<string, SceneObject> = {};
        const newSelectedIds: string[] = [];
        
        const selected = selectedObjectIds.map(id => objects[id]).filter(o => o && !o.parentId);

        selected.forEach(obj => {
            const newId = uuidv4();
            const newObject: SceneObject = {
                ...obj,
                id: newId,
                name: `${obj.name} Copy`,
                position: [ obj.position[0] + snap, obj.position[1], obj.position[2] + snap ]
            };
            newObjects[newId] = newObject;
            newSelectedIds.push(newId);
        });

        return {
            objects: {...objects, ...newObjects},
            selectedObjectIds: newSelectedIds,
        };
      });
    },

    groupSelectedObjects: () => {
        const { selectedObjectIds, objects } = get();
        if (selectedObjectIds.length < 2) return;
    
        setWithHistory(state => {
            const newObjects = { ...state.objects };
            const selected = selectedObjectIds.map(id => newObjects[id]).filter(Boolean);
            
            const center = new THREE.Vector3();
            selected.forEach(o => center.add(new THREE.Vector3(...o.position)));
            center.divideScalar(selected.length);

            const groupId = uuidv4();
            const newGroup: SceneObject = {
                id: groupId,
                type: 'group',
                name: 'Group',
                position: center.toArray(),
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
                color: '#ffffff',
                metalness: 0,
                roughness: 1,
                opacity: 1,
                transparent: false,
                emissiveColor: '#000000',
                emissiveIntensity: 0,
                wireframe: false,
                isVisible: true,
                isLocked: false,
            };

            selected.forEach(o => {
                const newPosition = new THREE.Vector3(...o.position).sub(center);
                newObjects[o.id] = { ...o, parentId: groupId, position: newPosition.toArray() as [number,number,number] };
            });
            
            newObjects[groupId] = newGroup;

            return {
                objects: newObjects,
                selectedObjectIds: [groupId],
            };
        });
    },

    ungroupSelectedObjects: () => {
        const { selectedObjectIds, objects } = get();
        const selectedGroups = selectedObjectIds.map(id => objects[id]).filter(o => o?.type === 'group');
        if (selectedGroups.length === 0) return;

        setWithHistory(state => {
            const newObjects = { ...state.objects };
            const newSelectedIds: string[] = [];

            selectedGroups.forEach(group => {
                // 1. Calculate the world matrix of the group. This matrix represents the
                // combined transformation (position, rotation, scale) of the group itself.
                const groupMatrix = new THREE.Matrix4().compose(
                    new THREE.Vector3(...group.position),
                    new THREE.Quaternion().setFromEuler(new THREE.Euler(...group.rotation)),
                    new THREE.Vector3(...group.scale)
                );

                // 2. Iterate through all objects to find children of the current group.
                Object.values(newObjects).forEach(o => {
                    if (o.parentId === group.id) {
                        newSelectedIds.push(o.id);
                        // 3. For each child, create its local matrix relative to the group.
                        const childMatrix = new THREE.Matrix4().compose(
                            new THREE.Vector3(...o.position),
                            new THREE.Quaternion().setFromEuler(new THREE.Euler(...o.rotation)),
                            new THREE.Vector3(...o.scale)
                        );
                        
                        // 4. Multiply the group's world matrix by the child's local matrix
                        // to get the child's final world matrix.
                        const finalMatrix = new THREE.Matrix4().multiplyMatrices(groupMatrix, childMatrix);
                        
                        // 5. Decompose the final world matrix back into position, rotation (quaternion), and scale vectors.
                        // This gives us the child's new world-space transform.
                        const pos = new THREE.Vector3();
                        const rot = new THREE.Quaternion();
                        const scl = new THREE.Vector3();
                        finalMatrix.decompose(pos, rot, scl);

                        // 6. Update the child object, removing its parentId and setting its new
                        // world-space transform as its local transform.
                        newObjects[o.id] = { ...o, parentId: undefined, position: pos.toArray() as [number,number,number], rotation: new THREE.Euler().setFromQuaternion(rot).toArray() as [number,number,number], scale: scl.toArray() as [number,number,number] };
                    }
                });
                // 7. Finally, remove the now-empty group object.
                delete newObjects[group.id];
            });
            
            return {
                objects: newObjects,
                selectedObjectIds: newSelectedIds,
            };
        });
    },

    alignSelectedObjects: (axis, edge) => {
        const { selectedObjectIds, objects } = get();
        if (selectedObjectIds.length < 2) return;

        setWithHistory(state => {
            const newObjects = { ...state.objects };
            const selected = selectedObjectIds.map(id => newObjects[id]).filter(Boolean);

            // 1. Get the world-space bounding box for each selected object.
            const boxes = selected.map(obj => ({ obj, box: getObjectWorldBoundingBox(obj, newObjects) }));
            
            // 2. Determine the target alignment value based on the chosen edge (min, max, or center).
            let target: number;
            if (edge === 'min') {
                target = Math.min(...boxes.map(b => b.box.min[axis]));
            } else if (edge === 'max') {
                target = Math.max(...boxes.map(b => b.box.max[axis]));
            } else { // center
                const centers = boxes.map(b => {
                    const center = new THREE.Vector3();
                    b.box.getCenter(center);
                    return center[axis];
                });
                target = centers.reduce((acc, c) => acc + c, 0) / centers.length;
            }

            // 3. For each object, calculate the necessary offset to move it to the target position.
            boxes.forEach(({ obj, box }) => {
                const center = new THREE.Vector3();
                box.getCenter(center);
                
                let currentEdge: number;
                if (edge === 'min') currentEdge = box.min[axis];
                else if (edge === 'max') currentEdge = box.max[axis];
                else currentEdge = center[axis];
                
                const offset = target - currentEdge;

                // 4. Apply the offset to the object's world position.
                const worldMatrix = getObjectWorldMatrix(obj, newObjects);
                const worldPos = new THREE.Vector3().setFromMatrixPosition(worldMatrix);

                const offsetVec = new THREE.Vector3();
                offsetVec[axis] = offset;
                const newWorldPos = worldPos.add(offsetVec);

                // 5. If the object is parented, convert the new world position back to a local position
                // relative to its parent.
                let newLocalPos: THREE.Vector3;
                if (obj.parentId && newObjects[obj.parentId]) {
                    const parentWorldMatrix = getObjectWorldMatrix(newObjects[obj.parentId], newObjects);
                    const invParentMatrix = new THREE.Matrix4().copy(parentWorldMatrix).invert();
                    newLocalPos = newWorldPos.applyMatrix4(invParentMatrix);
                } else {
                    newLocalPos = newWorldPos;
                }
                newObjects[obj.id] = { ...obj, position: newLocalPos.toArray() };
            });

            return { objects: newObjects };
        });
    },

    distributeSelectedObjects: (axis) => {
        const { selectedObjectIds, objects } = get();
        if (selectedObjectIds.length < 3) return; // Distribution needs at least 3 objects

        setWithHistory(state => {
            const newObjects = { ...state.objects };

            // 1. Get objects, their world bounding boxes, and centers, then sort them along the chosen axis.
            const items = selectedObjectIds.map(id => {
                const obj = newObjects[id];
                const box = getObjectWorldBoundingBox(obj, newObjects);
                const center = new THREE.Vector3();
                box.getCenter(center);
                return { obj, box, center };
            }).sort((a, b) => a.center[axis] - b.center[axis]);

            const minItem = items[0];
            const maxItem = items[items.length - 1];

            // 2. Calculate the total space to be distributed and the size of each gap.
            const totalSpan = maxItem.box.max[axis] - minItem.box.min[axis];
            const totalSize = items.reduce((sum, item) => sum + (item.box.max[axis] - item.box.min[axis]), 0);
            const gap = (totalSpan - totalSize) / (items.length - 1);
            
            // 3. Iterate through the objects (excluding the first and last) and reposition them.
            let currentPos = minItem.box.max[axis] + gap;

            for (let i = 1; i < items.length - 1; i++) {
                const { obj, box } = items[i];
                const size = box.max[axis] - box.min[axis];
                const targetMin = currentPos;
                const offset = targetMin - box.min[axis];
                
                // 4. Apply the calculated offset, converting from world to local space if necessary.
                const worldMatrix = getObjectWorldMatrix(obj, newObjects);
                const worldPos = new THREE.Vector3().setFromMatrixPosition(worldMatrix);

                const offsetVec = new THREE.Vector3();
                offsetVec[axis] = offset;
                const newWorldPos = worldPos.add(offsetVec);

                let newLocalPos: THREE.Vector3;
                if (obj.parentId && newObjects[obj.parentId]) {
                    const parentWorldMatrix = getObjectWorldMatrix(newObjects[obj.parentId], newObjects);
                    const invParentMatrix = new THREE.Matrix4().copy(parentWorldMatrix).invert();
                    newLocalPos = newWorldPos.applyMatrix4(invParentMatrix);
                } else {
                    newLocalPos = newWorldPos;
                }
                newObjects[obj.id] = { ...obj, position: newLocalPos.toArray() };

                currentPos += size + gap;
            }

            return { objects: newObjects };
        });
    },
    
    mirrorSelectedObjects: (axis) => {
        const { selectedObjectIds, objects } = get();
        if (selectedObjectIds.length === 0) return;

        setWithHistory(state => {
            const newObjects = { ...state.objects };
            const selected = selectedObjectIds.map(id => newObjects[id]).filter(Boolean);

            // 1. Calculate the total bounding box of the entire selection to find its center.
            const totalBox = new THREE.Box3();
            selected.forEach(obj => {
                const box = getObjectWorldBoundingBox(obj, newObjects);
                totalBox.union(box);
            });
            const pivot = new THREE.Vector3();
            totalBox.getCenter(pivot);

            // 2. For each object, mirror its world position across the pivot point.
            selected.forEach(obj => {
                const worldMatrix = getObjectWorldMatrix(obj, newObjects);
                const worldPos = new THREE.Vector3().setFromMatrixPosition(worldMatrix);

                const relativePos = worldPos.clone().sub(pivot);
                relativePos[axis] *= -1; // Invert the position along the mirror axis.
                const newWorldPos = pivot.clone().add(relativePos);

                // NOTE: This is a simplified mirror that only affects position.
                // A full mirror would also invert scale and adjust rotation, which is more complex.
                let newLocalPos: THREE.Vector3;
                 if (obj.parentId && newObjects[obj.parentId]) {
                    const parentWorldMatrix = getObjectWorldMatrix(newObjects[obj.parentId], newObjects);
                    const invParentMatrix = new THREE.Matrix4().copy(parentWorldMatrix).invert();
                    newLocalPos = newWorldPos.applyMatrix4(invParentMatrix);
                } else {
                    newLocalPos = newWorldPos;
                }
                newObjects[obj.id] = { ...obj, position: newLocalPos.toArray() };
            });

            return { objects: newObjects };
        });
    },
    
    toggleObjectProperty: (id: string, property: 'isVisible' | 'isLocked') => {
        set((state) => {
            const newObjects = { ...state.objects };
            const queue = [id];
            const processed = new Set<string>();
            const startValue = !newObjects[id]?.[property];
            let newSelectedIds = [...state.selectedObjectIds];

            while(queue.length > 0) {
                const currentId = queue.shift()!;
                if (processed.has(currentId)) continue;
                processed.add(currentId);

                const obj = newObjects[currentId];
                if(obj) {
                    newObjects[currentId] = { ...obj, [property]: startValue };

                    if (property === 'isLocked' && startValue) {
                      newSelectedIds = newSelectedIds.filter(sid => sid !== currentId);
                    }

                    Object.values(newObjects).forEach(child => {
                        if (child.parentId === currentId) {
                            queue.push(child.id);
                        }
                    });
                }
            }
            return { objects: newObjects, selectedObjectIds: newSelectedIds };
        });
    },

    toggleSnapping: () => set((state) => ({ isSnappingEnabled: !state.isSnappingEnabled })),
    setGizmoMode: (mode: GizmoMode) => set({ gizmoMode: mode }),
    toggleFocusMode: () => {
      set((state) => {
        if (!state.isFocusModeActive && state.selectedObjectIds.length === 0) return { isFocusModeActive: false };
        return { isFocusModeActive: !state.isFocusModeActive };
      });
    },
    setFocusMode: (isActive: boolean) => set({ isFocusModeActive: isActive }),
    toggleCameraProjection: () => set(state => ({ cameraProjection: state.cameraProjection === 'perspective' ? 'orthographic' : 'perspective' })),

    startDrag: (objectId: string, intersectionPoint: THREE.Vector3) => {
      const object = get().objects[objectId];
      if (!object || object.isLocked) return;
      const objectPosition = new THREE.Vector3().fromArray(object.position);
      set({
        dragState: { isDragging: true, objectId, plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -objectPosition.y), startPoint: intersectionPoint.clone(), startObjectPosition: objectPosition.clone() }
      });
    },
    endDrag: () => {
      const { dragState, objects } = get();
      if (!dragState.isDragging || !dragState.objectId) return;

      const finalObject = objects[dragState.objectId];
      if (!finalObject) return;
      
      const updater = (state: AppState) => {
        // Only update the position property that was being dragged
        const newObjects = { ...state.objects, [finalObject.id]: { ...finalObject, position: finalObject.position } };
        return { 
          objects: newObjects,
          dragState: { isDragging: false, objectId: null, plane: null, startPoint: null, startObjectPosition: null }
        };
      };
      setWithHistory(updater);
    },

    undo: () => {
      set(state => {
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          const prevState = state.history[newIndex];
          return { ...prevState, historyIndex: newIndex };
        }
        return {}; // No change
      });
    },

    redo: () => {
      set(state => {
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          const nextState = state.history[newIndex];
          return { ...nextState, historyIndex: newIndex };
        }
        return {}; // No change
      });
    },

    saveScene: () => {
        const { objects, gridConfig } = get();
        const sceneData = JSON.stringify({
          objects: Object.values(objects),
          gridConfig,
        });
        const blob = new Blob([sceneData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scene-${Date.now()}.cadlabo`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    loadScene: (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const loadedData = JSON.parse(e.target?.result as string);
            
            let loadedObjects: unknown[];
            let loadedGridConfig: Partial<AppState['gridConfig']> | undefined;

            // Backward compatibility check for old scene files (array of objects)
            if (Array.isArray(loadedData)) {
                loadedObjects = loadedData;
            } else if (typeof loadedData === 'object' && loadedData !== null && Array.isArray(loadedData.objects)) {
                loadedObjects = loadedData.objects;
                if (typeof loadedData.gridConfig === 'object' && loadedData.gridConfig !== null) {
                    loadedGridConfig = loadedData.gridConfig;
                }
            } else {
                throw new Error("Invalid scene file format.");
            }
    
            const { objects: currentObjects } = get();
            Object.values(currentObjects).forEach(cleanupObjectUrls);
    
            const newObjects: Record<string, SceneObject> = {};
            const idMap: Record<string, string> = {};
    
            // FIX: Add type guard to safely handle objects of type 'unknown' loaded from a file.
            // This resolves errors from attempting to access properties like 'id' or 'parentId'.
            type LoadableObject = { id: string; parentId?: unknown; [key: string]: unknown };

            const isLoadable = (o: unknown): o is LoadableObject =>
              typeof o === 'object' && o !== null && typeof (o as { id?: unknown })?.id === 'string';
            
            const loadableObjects = loadedObjects.filter(isLoadable);

            // First, create a map of old IDs to new UUIDs for all valid objects.
            for (const obj of loadableObjects) {
                idMap[obj.id] = uuidv4();
            }

            // This loop rebuilds the scene graph with new IDs.
            for (const obj of loadableObjects) {
                const oldId = obj.id;
                const newId = idMap[oldId];

                const { parentId, ...rest } = obj;
                // FIX: Use a double cast through 'unknown' to inform TypeScript that the structure of `rest`
                // matches the SceneObject, resolving the type conversion error. This is safe under the
                // assumption that the loaded scene file is valid.
                const newSceneObject: SceneObject = {
                    ...(rest as unknown as Omit<SceneObject, 'id' | 'parentId'>),
                    id: newId,
                };
                
                // Safely remap parentId if it exists and is a valid string in our ID map.
                if (typeof parentId === 'string' && idMap[parentId]) {
                  newSceneObject.parentId = idMap[parentId];
                }
                
                newObjects[newId] = newSceneObject;
            }
    
            setWithHistory((state) => {
                const newGridConfig = loadedGridConfig
                    ? { gridConfig: { ...state.gridConfig, ...loadedGridConfig } }
                    : {};
                return {
                    objects: newObjects,
                    selectedObjectIds: [],
                    isFocusModeActive: false,
                    ...newGridConfig
                };
            });
          } catch (error) {
            console.error("Failed to load scene", error);
            toast.error("Invalid or corrupt scene file.");
          }
        };
        reader.readAsText(file);
    },

    // Measurement actions
    toggleMeasureMode: () => set(state => {
        const isActive = !state.isMeasureModeActive;
        if (isActive) {
            return { isMeasureModeActive: true, creationState: { shapeType: null } };
        }
        return { isMeasureModeActive: false, currentMeasurement: { start: null, end: null } };
    }),
    startOrEndMeasurement: (point) => set(state => {
        if (!state.currentMeasurement.start) {
            return { currentMeasurement: { start: point, end: point } };
        } else {
            const newMeasurement: Measurement = {
                id: uuidv4(),
                start: state.currentMeasurement.start,
                end: point,
            };
            return {
                measurements: [...state.measurements, newMeasurement],
                currentMeasurement: { start: null, end: null }
            };
        }
    }),
    updateCurrentMeasurementEnd: (point) => set(state => {
        if (state.currentMeasurement.start) {
            return { currentMeasurement: { ...state.currentMeasurement, end: point } };
        }
        return {};
    }),
    cancelCurrentMeasurement: () => set({ currentMeasurement: { start: null, end: null } }),
    clearAllMeasurements: () => set({ measurements: [] }),

    // Grid actions
    toggleGridVisibility: () => set(state => ({ isGridVisible: !state.isGridVisible })),
    setGridConfig: (config) => set(state => ({
        gridConfig: { ...state.gridConfig, ...config },
    })),

    // UI actions
    toggleInspector: () => set(state => ({ isInspectorCollapsed: !state.isInspectorCollapsed })),
    toggleToolbar: () => set(state => ({ isToolbarCollapsed: !state.isToolbarCollapsed })),
  };
});

export default useStore;