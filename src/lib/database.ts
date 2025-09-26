// src/lib/database.ts
/**
 * Local IndexedDB storage for habitat designs and custom shapes
 * Provides save/load functionality for user work
 */

import { Layout } from './schemas';

// Database configuration
const DB_NAME = 'habitat-designer-db';
const DB_VERSION = 1;
const DESIGNS_STORE = 'designs';
const SHAPES_STORE = 'customShapes';

// Design metadata
export interface SavedDesign {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  layout: Layout;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

// Custom shape definition
export interface CustomShape {
  id: string;
  name: string;
  description?: string;
  geometryType: string;
  parameters: Record<string, any>;
  preview?: string; // Base64 image
  createdAt: Date;
  category: 'habitat' | 'utility' | 'structural' | 'custom';
}

// Database connection
let db: IDBDatabase | null = null;

// Initialize IndexedDB
export async function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };
    
    request.onupgradeneeded = () => {
      const database = request.result;
      
      // Create designs store
      if (!database.objectStoreNames.contains(DESIGNS_STORE)) {
        const designsStore = database.createObjectStore(DESIGNS_STORE, { keyPath: 'id' });
        designsStore.createIndex('name', 'name', { unique: false });
        designsStore.createIndex('createdAt', 'createdAt', { unique: false });
        designsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      }
      
      // Create custom shapes store
      if (!database.objectStoreNames.contains(SHAPES_STORE)) {
        const shapesStore = database.createObjectStore(SHAPES_STORE, { keyPath: 'id' });
        shapesStore.createIndex('name', 'name', { unique: false });
        shapesStore.createIndex('category', 'category', { unique: false });
      }
    };
  });
}

// Design management functions
export async function saveDesign(design: Omit<SavedDesign, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!db) throw new Error('Database not initialized');
  
  const id = `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  
  const savedDesign: SavedDesign = {
    ...design,
    id,
    createdAt: now,
    updatedAt: now
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([DESIGNS_STORE], 'readwrite');
    const store = transaction.objectStore(DESIGNS_STORE);
    const request = store.add(savedDesign);
    
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

export async function updateDesign(id: string, updates: Partial<SavedDesign>): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([DESIGNS_STORE], 'readwrite');
    const store = transaction.objectStore(DESIGNS_STORE);
    
    // Get existing design
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const existingDesign = getRequest.result;
      if (!existingDesign) {
        reject(new Error('Design not found'));
        return;
      }
      
      // Update design
      const updatedDesign: SavedDesign = {
        ...existingDesign,
        ...updates,
        id, // Preserve original ID
        updatedAt: new Date()
      };
      
      const updateRequest = store.put(updatedDesign);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(updateRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function loadDesign(id: string): Promise<SavedDesign | null> {
  if (!db) throw new Error('Database not initialized');
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([DESIGNS_STORE], 'readonly');
    const store = transaction.objectStore(DESIGNS_STORE);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function listDesigns(): Promise<SavedDesign[]> {
  if (!db) throw new Error('Database not initialized');
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([DESIGNS_STORE], 'readonly');
    const store = transaction.objectStore(DESIGNS_STORE);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const designs = request.result;
      // Sort by updatedAt descending
      designs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      resolve(designs);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDesign(id: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([DESIGNS_STORE], 'readwrite');
    const store = transaction.objectStore(DESIGNS_STORE);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Custom shape management functions
export async function saveCustomShape(shape: Omit<CustomShape, 'id' | 'createdAt'>): Promise<string> {
  if (!db) throw new Error('Database not initialized');
  
  const id = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const customShape: CustomShape = {
    ...shape,
    id,
    createdAt: new Date()
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([SHAPES_STORE], 'readwrite');
    const store = transaction.objectStore(SHAPES_STORE);
    const request = store.add(customShape);
    
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

export async function loadCustomShape(id: string): Promise<CustomShape | null> {
  if (!db) throw new Error('Database not initialized');
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([SHAPES_STORE], 'readonly');
    const store = transaction.objectStore(SHAPES_STORE);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function listCustomShapes(): Promise<CustomShape[]> {
  if (!db) throw new Error('Database not initialized');
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([SHAPES_STORE], 'readonly');
    const store = transaction.objectStore(SHAPES_STORE);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCustomShape(id: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([SHAPES_STORE], 'readwrite');
    const store = transaction.objectStore(SHAPES_STORE);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Search and filter functions
export async function searchDesigns(query: string): Promise<SavedDesign[]> {
  const allDesigns = await listDesigns();
  const lowercaseQuery = query.toLowerCase();
  
  return allDesigns.filter(design => 
    design.name.toLowerCase().includes(lowercaseQuery) ||
    design.description?.toLowerCase().includes(lowercaseQuery) ||
    design.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export async function getDesignsByTag(tag: string): Promise<SavedDesign[]> {
  if (!db) throw new Error('Database not initialized');
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([DESIGNS_STORE], 'readonly');
    const store = transaction.objectStore(DESIGNS_STORE);
    const index = store.index('tags');
    const request = index.getAll(tag);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Export/Import functions
export async function exportDesign(id: string): Promise<string> {
  const design = await loadDesign(id);
  if (!design) throw new Error('Design not found');
  
  return JSON.stringify(design, null, 2);
}

export async function importDesign(designJSON: string): Promise<string> {
  try {
    const design = JSON.parse(designJSON) as SavedDesign;
    
    // Create new design with imported data
    const { id, createdAt, updatedAt, ...designData } = design;
    return await saveDesign({
      ...designData,
      name: `${design.name} (Imported)`
    });
  } catch (error) {
    throw new Error('Invalid design file format');
  }
}

// Initialize database on module load
initDatabase().catch(console.error);