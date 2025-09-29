import { create } from 'zustand';
import { SceneObject, ShapeType, GizmoMode } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';

type HistoryState = Pick<AppState, 'objects' | 'selectedObjectIds'>;

/**
 * Defines the shape of the application's state.
 */
interface AppState {
  objects: SceneObject[];
  selectedObjectIds: string[];
  isSnappingEnabled: boolean;
  gizmoMode: GizmoMode;
  isFocusModeActive: boolean;
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
  history: HistoryState[];
  historyIndex: number;
  addObject: (type: ShapeType) => void;
  addImportedObject: (data: { modelUrl: string; fileMap?: Record<string, string> }) => void;
  setSelectedObjectIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  updateObject: (id: string, newProps: Partial<SceneObject>, skipHistory?: boolean) => void;
  updateObjects: (updates: { id: string, newProps: Partial<SceneObject> }[], skipHistory?: boolean) => void;
  removeObject: (id: string) => void;
  removeSelectedObjects: () => void;
  duplicateSelectedObjects: () => void;
  toggleSnapping: () => void;
  setGizmoMode: (mode: GizmoMode) => void;
  toggleFocusMode: () => void;
  setFocusMode: (isActive: boolean) => void;
  startDrag: (objectId: string, intersectionPoint: THREE.Vector3) => void;
  endDrag: () => void;
  undo: () => void;
  redo: () => void;
}

/**
 * Utility to clean up blob URLs associated with a SceneObject to prevent memory leaks.
 */
const cleanupObjectUrls = (object: SceneObject) => {
  if (object.type === 'model') {
    if (object.modelUrl && object.modelUrl.startsWith('blob:')) {
      URL.revokeObjectURL(object.modelUrl);
    }
    if (object.fileMap) {
      Object.values(object.fileMap).forEach(URL.revokeObjectURL);
    }
  }
};

const useStore = create<AppState>((set, get) => {
  const setWithHistory: typeof set = (updater, replace, actionName) => {
    const { history, historyIndex, objects, selectedObjectIds } = get();
    // Create a snapshot of the current state before the update
    const snapshot: HistoryState = { objects, selectedObjectIds };
    
    // Truncate future history if we're not at the end of the stack
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(snapshot);
    
    // Call the original set function
    set(state => ({ ...updater(state), history: newHistory, historyIndex: newHistory.length - 1 }), replace);
  };

  return {
    objects: [],
    selectedObjectIds: [],
    isSnappingEnabled: false,
    gizmoMode: 'translate',
    isFocusModeActive: false,
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
    history: [{ objects: [], selectedObjectIds: [] }],
    historyIndex: 0,

    addObject: (type: ShapeType) => {
      setWithHistory((state) => {
        const { snapIncrement } = state;
        const snap = snapIncrement.translate;
        
        let initialY = 0.5;
        let scale: [number, number, number] = [1, 1, 1];
        
        switch (type) {
          case 'sphere': initialY = 0.8; break;
          case 'cylinder': initialY = 0.75; break;
          case 'torus': initialY = 0.2; break;
          case 'cone': initialY = 0.75; break;
          case 'plane': initialY = 0; scale = [2, 2, 2]; break;
        }
        
        const newObject: SceneObject = {
          id: uuidv4(),
          type,
          position: [
            Math.round((Math.random() * 4 - 2) / snap) * snap,
            initialY,
            Math.round((Math.random() * 4 - 2) / snap) * snap
          ],
          rotation: [0, 0, 0],
          scale,
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        };
        return { 
            objects: [...state.objects, newObject],
            selectedObjectIds: [newObject.id]
        };
      }, false, 'addObject');
    },
    
    addImportedObject: (data: { modelUrl: string; fileMap?: Record<string, string> }) => {
      setWithHistory((state) => {
        const { snapIncrement } = state;
        const snap = snapIncrement.translate;
        const newObject: SceneObject = {
          id: uuidv4(),
          type: 'model',
          modelUrl: data.modelUrl,
          fileMap: data.fileMap,
          position: [
            Math.round((Math.random() * 4 - 2) / snap) * snap,
            1,
            Math.round((Math.random() * 4 - 2) / snap) * snap
          ],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        };
        return { 
            objects: [...state.objects, newObject],
            selectedObjectIds: [newObject.id]
        };
      }, false, 'addImportedObject');
    },

    setSelectedObjectIds: (ids: string[]) => {
      // This action might not need its own history entry if it's part of another action.
      // However, direct selection changes should be undoable.
      setWithHistory(state => {
        if (ids.length === 0 && state.isFocusModeActive) {
          return { selectedObjectIds: ids, isFocusModeActive: false };
        }
        return { selectedObjectIds: ids };
      }, false, 'setSelectedObjectIds');
    },
    
    addToSelection: (id: string) => {
      setWithHistory((state) => {
        const newSelection = new Set(state.selectedObjectIds);
        newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
        const newSelectedIds = Array.from(newSelection);

        if (newSelectedIds.length === 0 && state.isFocusModeActive) {
          return { selectedObjectIds: newSelectedIds, isFocusModeActive: false };
        }
        return { selectedObjectIds: newSelectedIds };
      }, false, 'addToSelection');
    },

    updateObject: (id: string, newProps: Partial<SceneObject>, skipHistory = false) => {
      const updater = (state: AppState) => ({
        objects: state.objects.map((obj) =>
          obj.id === id ? { ...obj, ...newProps } : obj
        ),
      });
      if (skipHistory) {
        set(updater);
      } else {
        setWithHistory(updater, false, 'updateObject');
      }
    },

    updateObjects: (updates: { id: string, newProps: Partial<SceneObject> }[], skipHistory = false) => {
      const updater = (state: AppState) => {
        const updatesMap = new Map(updates.map(u => [u.id, u.newProps]));
        return {
          objects: state.objects.map((obj) =>
            updatesMap.has(obj.id) ? { ...obj, ...updatesMap.get(obj.id) } : obj
          ),
        };
      };
      if (skipHistory) {
        set(updater);
      } else {
        setWithHistory(updater, false, 'updateObjects');
      }
    },
    
    removeObject: (id: string) => {
      const objectToRemove = get().objects.find(obj => obj.id === id);
      if (objectToRemove) {
          cleanupObjectUrls(objectToRemove);
      }
      setWithHistory((state) => ({
        objects: state.objects.filter((obj) => obj.id !== id),
        selectedObjectIds: state.selectedObjectIds.filter(selectedId => selectedId !== id),
      }), false, 'removeObject');
    },

    removeSelectedObjects: () => {
      if (get().selectedObjectIds.length === 0) return;
      setWithHistory((state) => {
        const { objects, selectedObjectIds } = state;
        const objectsToRemove = objects.filter(obj => selectedObjectIds.includes(obj.id));
        objectsToRemove.forEach(cleanupObjectUrls);

        return {
          objects: objects.filter(obj => !selectedObjectIds.includes(obj.id)),
          selectedObjectIds: [],
          isFocusModeActive: false,
        };
      }, false, 'removeSelectedObjects');
    },

    duplicateSelectedObjects: () => {
      if (get().selectedObjectIds.length === 0) return;
      setWithHistory(state => {
        const { objects, selectedObjectIds, snapIncrement } = state;
        const snap = snapIncrement.translate;
        const newObjects: SceneObject[] = [];
        const newSelectedIds: string[] = [];
        
        const selected = objects.filter(o => selectedObjectIds.includes(o.id));

        selected.forEach(obj => {
            const newId = uuidv4();
            const newObject: SceneObject = {
                ...obj,
                id: newId,
                position: [
                    obj.position[0] + snap,
                    obj.position[1],
                    obj.position[2] + snap,
                ]
            };
            newObjects.push(newObject);
            newSelectedIds.push(newId);
        });

        return {
            objects: [...objects, ...newObjects],
            selectedObjectIds: newSelectedIds,
        };
      }, false, 'duplicateSelectedObjects');
    },

    toggleSnapping: () => set((state) => ({ isSnappingEnabled: !state.isSnappingEnabled })),
    setGizmoMode: (mode: GizmoMode) => set({ gizmoMode: mode }),
    toggleFocusMode: () => {
      set((state) => {
        if (!state.isFocusModeActive && state.selectedObjectIds.length === 0) {
          return { isFocusModeActive: false };
        }
        return { isFocusModeActive: !state.isFocusModeActive };
      });
    },
    setFocusMode: (isActive: boolean) => set({ isFocusModeActive: isActive }),

    startDrag: (objectId: string, intersectionPoint: THREE.Vector3) => {
      const object = get().objects.find(o => o.id === objectId);
      if (!object) return;

      const objectPosition = new THREE.Vector3().fromArray(object.position);
      set({
        dragState: {
          isDragging: true,
          objectId: objectId,
          plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -objectPosition.y),
          startPoint: intersectionPoint.clone(),
          startObjectPosition: objectPosition.clone(),
        }
      });
    },
    endDrag: () => {
      // Final state of the drag should be a history entry
      setWithHistory(state => {
        return {
          dragState: {
            isDragging: false,
            objectId: null,
            plane: null,
            startPoint: null,
            startObjectPosition: null,
          }
        };
      }, false, 'endDrag');
    },

    undo: () => {
      set(state => {
        const { history, historyIndex } = state;
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          const previousState = history[newIndex];
          return { ...previousState, historyIndex: newIndex };
        }
        return {};
      });
    },

    redo: () => {
      set(state => {
        const { history, historyIndex } = state;
        if (historyIndex < history.length - 2) { // historyIndex points to current, last valid is length - 1, so we need to be less than length-2 to redo to length-1
            const newIndex = historyIndex + 1;
            const nextState = history[newIndex + 1];
            return { ...nextState, historyIndex: newIndex };
        }
        return {};
      });
    },
  };
});

export default useStore;
