import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Loader2, CheckCircle, Lightbulb, Settings, Trash2, Camera, Eye, Plus, Minus, Save, Folder, Shapes, PanelLeft, PanelLeftClose, Network } from 'lucide-react';

// Import your existing NASA schema and API
import { FAIRINGS, MODULE_PRESETS, FunctionalType } from '@/lib/DEFAULTS';

import { postAnalyzeRaw } from '@/api/analyzer';
import { Layout, Scenario } from '@/lib/schemas';

// Database and collections
import { saveDesign, SavedDesign, initDatabase } from '@/lib/database';
import Collections from './Collections';
import ShapeBuilder from './ShapeBuilder';

import { MetricsHeader } from '@/features/analyze/MetricsHeader';
import AnalysisResults from '@/ui/AnalysisResults';

// Enhanced module types mapping from NASA functional areas to realistic 3D properties
// NASA Clean/Dirty Area Classification for Visual Indicators
const NASA_AREA_TYPES = {
  CLEAN: ['CREW_SLEEP', 'FOOD_PREP', 'MEDICAL', 'WORKSTATION', 'COMMON_AREA', 'RECREATION'],
  DIRTY: ['EXERCISE', 'HYGIENE', 'WASTE', 'MAINTENANCE', 'TRASH_MGMT'],
  TECHNICAL: ['ECLSS', 'STOWAGE', 'AIRLOCK', 'GLOVEBOX', 'CUSTOM_CAD']
};

const MODULE_TYPES_3D = {
  CREW_SLEEP: { 
    color: '#3b82f6', 
    icon: '🛏️', 
    size: { width: 0.91, height: 1.98, depth: 0.76 }, // Real NASA crew quarters: 30"×30"×78" (ISS standard)
    geometry: 'sleep_pod', // Custom sleep pod shape
    nasaCategory: 'CLEAN',
    minDimensions: { width: 0.76, height: 1.98, depth: 0.76 }, // NASA absolute minimums
    realWorldRef: 'ISS crew quarters (30"×30"×78")'
  },
  HYGIENE: { 
    color: '#10b981', 
    icon: '🚿', 
    size: { width: 1.14, height: 1.98, depth: 0.76 }, // Real NASA hygiene: 45"×30"×78" (ISS WHC)
    geometry: 'cylinder', // Cylindrical shower module
    nasaCategory: 'DIRTY',
    minDimensions: { width: 1.14, height: 1.98, depth: 0.76 }, // NASA hygiene minimums
    realWorldRef: 'ISS Waste & Hygiene Compartment (45"×30"×78")'
  },
  WASTE: { 
    color: '#f59e0b', 
    icon: '🚽', 
    size: { width: 0.76, height: 1.98, depth: 0.76 }, // Real NASA WCS: 30"×30"×78" (ISS WCS)
    geometry: 'rounded_box', // Rounded waste management unit
    nasaCategory: 'DIRTY',
    minDimensions: { width: 0.76, height: 1.98, depth: 0.76 }, // NASA WCS minimums
    realWorldRef: 'ISS Waste Collection System (30"×30"×78")'
  },
  EXERCISE: { 
    color: '#ef4444', 
    icon: '🏋️', 
    size: { width: 1.83, height: 2.13, depth: 1.22 }, // Real NASA ARED: 72"×84"×48" (ISS exercise device)
    geometry: 'gym_module', // Multi-level exercise area
    nasaCategory: 'DIRTY',
    minDimensions: { width: 1.52, height: 2.13, depth: 1.22 }, // NASA exercise space minimums
    realWorldRef: 'ISS Advanced Resistive Exercise Device (ARED)'
  },
  FOOD_PREP: { 
    color: '#8b5cf6', 
    icon: '🍳', 
    size: { width: 1.52, height: 2.13, depth: 0.61 }, // Real NASA galley: 60"×84"×24" (ISS Unity galley)
    geometry: 'kitchen_module', // L-shaped kitchen module
    nasaCategory: 'CLEAN',
    minDimensions: { width: 1.22, height: 2.13, depth: 0.61 }, // NASA galley minimums
    realWorldRef: 'ISS Unity Node galley (60"×84"×24")'
  },
  ECLSS: { 
    color: '#22c55e', 
    icon: '💨', 
    size: { width: 0.63, height: 2.13, depth: 0.91 }, // Real NASA ECLSS rack: 25"×84"×36" (ISS rack standard)
    geometry: 'technical_rack', // Equipment rack with panels
    nasaCategory: 'TECHNICAL',
    minDimensions: { width: 0.63, height: 2.13, depth: 0.91 }, // NASA ECLSS rack standard
    realWorldRef: 'ISS International Standard Payload Rack (ISPR)'
  },
  MEDICAL: { 
    color: '#ec4899', 
    icon: '🏥', 
    size: { width: 1.22, height: 2.13, depth: 0.91 }, // Real NASA medical: 48"×84"×36" (ISS medical rack + workspace)
    geometry: 'medical_bay', // Medical examination area
    nasaCategory: 'CLEAN',
    minDimensions: { width: 1.22, height: 2.13, depth: 0.91 }, // NASA medical bay minimums
    realWorldRef: 'ISS Human Research Facility (HRF) + workspace'
  },
  MAINTENANCE: { 
    color: '#06b6d4', 
    icon: '🔧', 
    size: { width: 1.22, height: 2.13, depth: 1.22 }, // Real NASA maintenance: 48"×84"×48" (ISS maintenance area)
    geometry: 'workshop', // Workshop with tool storage
    nasaCategory: 'DIRTY',
    minDimensions: { width: 1.22, height: 2.13, depth: 1.22 }, // NASA maintenance minimums
    realWorldRef: 'ISS maintenance and stowage area'
  },
  CUSTOM_CAD: { 
    color: '#8b5cf6', 
    icon: '🏗️', 
    size: { width: 2.0, height: 2.0, depth: 2.0 },
    geometry: 'custom', // Custom CAD-designed module
    nasaCategory: 'TECHNICAL',
    minDimensions: { width: 1.0, height: 2.0, depth: 1.0 } // Minimum custom module size
  },
  STOWAGE: {
    color: '#f97316',
    icon: '📦',
    size: { width: 0.63, height: 2.13, depth: 0.91 }, // Real NASA stowage: 25"×84"×36" (ISS CTB storage rack)
    geometry: 'storage_rack', // Multi-compartment storage
    nasaCategory: 'TECHNICAL',
    minDimensions: { width: 0.63, height: 2.13, depth: 0.91 }, // NASA storage rack standard
    realWorldRef: 'ISS Cargo Transfer Bag (CTB) rack'
  },
  RECREATION: {
    color: '#84cc16',
    icon: '🎮',
    size: { width: 1.22, height: 2.13, depth: 1.22 }, // Real NASA recreation: 48"×84"×48" (ISS cupola viewing area size)
    geometry: 'lounge_pod', // Comfortable lounge area
    nasaCategory: 'CLEAN',
    minDimensions: { width: 1.22, height: 2.13, depth: 1.22 }, // NASA recreation minimums
    realWorldRef: 'ISS Cupola observation area dimensions'
  },
  WORKSTATION: {
    color: '#64748b',
    icon: '💻',
    size: { width: 0.76, height: 2.13, depth: 0.61 }, // Real NASA workstation: 30"×84"×24" (ISS laptop workstation)
    geometry: 'workstation', // Desk with equipment
    nasaCategory: 'CLEAN',
    minDimensions: { width: 0.76, height: 2.13, depth: 0.61 }, // NASA workstation minimums
    realWorldRef: 'ISS Mobile Service System (MSS) workstation'
  },
  AIRLOCK: {
    color: '#0ea5e9',
    icon: '🚪',
    size: { width: 1.27, height: 1.91, depth: 1.27 }, // Real NASA airlock: 50"×75"×50" (ISS Quest airlock internal)
    geometry: 'airlock_chamber', // Pressurized airlock
    nasaCategory: 'TECHNICAL',
    minDimensions: { width: 1.27, height: 1.91, depth: 1.27 }, // NASA airlock minimums
    realWorldRef: 'ISS Quest Joint Airlock internal dimensions'
  },
  GLOVEBOX: {
    color: '#8b5cf6',
    icon: '🧪',
    size: { width: 1.27, height: 0.89, depth: 0.89 }, // Real NASA glovebox: 50"×35"×35" (ISS Microgravity Science Glovebox)
    geometry: 'science_station', // Laboratory workstation
    nasaCategory: 'TECHNICAL',
    minDimensions: { width: 1.27, height: 0.89, depth: 0.89 }, // NASA glovebox standard
    realWorldRef: 'ISS Microgravity Science Glovebox (MSG)'
  },
  TRASH_MGMT: {
    color: '#6b7280',
    icon: '🗑️',
    size: { width: 0.76, height: 2.13, depth: 0.76 }, // Real NASA trash: 30"×84"×30" (ISS trash compactor size)
    geometry: 'compactor', // Waste compaction unit
    nasaCategory: 'DIRTY',
    minDimensions: { width: 0.76, height: 2.13, depth: 0.76 }, // NASA waste mgmt minimums
    realWorldRef: 'ISS Waste Collection System compactor'
  },
  COMMON_AREA: {
    color: '#f59e0b',
    icon: '👥',
    size: { width: 2.44, height: 2.13, depth: 2.44 }, // Real NASA common: 96"×84"×96" (ISS Unity node common area)
    geometry: 'community_space', // Open social area
    nasaCategory: 'CLEAN',
    minDimensions: { width: 2.44, height: 2.13, depth: 2.44 }, // NASA common area minimums
    realWorldRef: 'ISS Unity Node common area dimensions'
  }
};

function snap(n: number, step = 0.5) {
  return Math.round(n / step) * step;
}

// Create realistic 3D geometries for different NASA modules
function createModuleGeometry(geometryType: string, size: { w_m: number; l_m: number; h_m: number }): THREE.BufferGeometry {
  const { w_m, h_m, l_m } = size;
  
  switch (geometryType) {
    case 'sleep_pod':
      // Rounded sleep pod with curved top
      const sleepGeometry = new THREE.CapsuleGeometry(Math.min(w_m, l_m) / 2.2, h_m - Math.min(w_m, l_m) / 1.1, 4, 8);
      sleepGeometry.rotateZ(Math.PI / 2);
      return sleepGeometry;
      
    case 'cylinder':
      // Standard cylinder for hygiene modules
      return new THREE.CylinderGeometry(w_m / 2, w_m / 2, h_m, 16);
      
    case 'rounded_box':
      // Rounded rectangular module
      const roundedGeometry = new THREE.BoxGeometry(w_m, h_m, l_m);
      return roundedGeometry;
      
    case 'gym_module':
      // Multi-level exercise area with platforms
      const gymGroup = new THREE.Group();
      const mainBox = new THREE.BoxGeometry(w_m, h_m * 0.8, l_m);
      const platform = new THREE.BoxGeometry(w_m * 0.8, h_m * 0.2, l_m * 0.6);
      // Combine geometries (simplified for now)
      return mainBox;
      
    case 'kitchen_module':
      // L-shaped kitchen module
      const kitchenGeometry = new THREE.BoxGeometry(w_m, h_m, l_m);
      // Add a smaller extension for L-shape
      return kitchenGeometry;
      
    case 'technical_rack':
      // Equipment rack with panels - use taller, thinner box
      return new THREE.BoxGeometry(w_m, h_m * 1.2, l_m * 0.8);
      
    case 'medical_bay':
      // Medical examination area with curved elements
      const medicalGeometry = new THREE.BoxGeometry(w_m, h_m, l_m);
      // Round the corners slightly
      return medicalGeometry;
      
    case 'workshop':
      // Workshop with angled roof
      const workshopGeometry = new THREE.BoxGeometry(w_m, h_m, l_m);
      return workshopGeometry;
      
    case 'storage_rack':
      // Multi-compartment storage - taller and segmented
      return new THREE.BoxGeometry(w_m, h_m * 1.1, l_m);
      
    case 'lounge_pod':
      // Comfortable lounge area - rounded
      return new THREE.SphereGeometry(w_m / 2, 16, 12);
      
    case 'workstation':
      // Desk with equipment - angled top
      const workstationGeometry = new THREE.BoxGeometry(w_m, h_m, l_m);
      return workstationGeometry;
      
    case 'airlock_chamber':
      // Pressurized airlock - cylindrical with flat ends
      const airlockGeometry = new THREE.CylinderGeometry(w_m / 2, w_m / 2, h_m, 8);
      airlockGeometry.rotateZ(Math.PI / 2);
      return airlockGeometry;
      
    case 'science_station':
      // Laboratory workstation - compact cube with details
      return new THREE.BoxGeometry(w_m, h_m * 1.1, l_m);
      
    case 'compactor':
      // Waste compaction unit - cylindrical
      return new THREE.CylinderGeometry(w_m / 2.2, w_m / 2, h_m, 12);
      
    case 'community_space':
      // Open social area - octagonal base
      return new THREE.CylinderGeometry(w_m / 2, w_m / 2, h_m, 8);
      
    default:
      // Fallback to basic box
      return new THREE.BoxGeometry(w_m, h_m, l_m);
  }
}

// Create composite materials for more realistic modules with compliance indicators
function createModuleMaterial(moduleConfig: any, isSelected: boolean, complianceStatus?: 'compliant' | 'warning' | 'violation'): THREE.Material[] | THREE.Material {
  let baseColor = isSelected ? 0xffff00 : moduleConfig.color;
  
  // Override color based on compliance status
  if (!isSelected && complianceStatus) {
    switch (complianceStatus) {
      case 'compliant':
        // Add subtle green glow to compliant modules
        baseColor = new THREE.Color(moduleConfig.color).lerp(new THREE.Color(0x00ff00), 0.2).getHex();
        break;
      case 'warning':
        // Add orange tint for warnings
        baseColor = new THREE.Color(moduleConfig.color).lerp(new THREE.Color(0xff8800), 0.3).getHex();
        break;
      case 'violation':
        // Add red tint for violations
        baseColor = new THREE.Color(moduleConfig.color).lerp(new THREE.Color(0xff0000), 0.4).getHex();
        break;
    }
  }
  
  const opacity = complianceStatus === 'violation' ? 0.9 : 0.8; // More opaque for violations
  
  // Create different materials for different faces
  const materials = [
    new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity }), // Right
    new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity }), // Left
    new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity: opacity + 0.1 }), // Top (brighter)
    new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity: opacity - 0.1 }), // Bottom (darker)
    new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity }), // Front
    new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity })  // Back
  ];
  
  return materials;
}

// Create violation line between two modules
function createViolationLine(posA: THREE.Vector3, posB: THREE.Vector3): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([posA, posB]);
  const material = new THREE.LineBasicMaterial({ 
    color: 0xff0000, 
    linewidth: 3,
    transparent: true,
    opacity: 0.8
  });
  const line = new THREE.Line(geometry, material);
  return line;
}

// Create danger zone around a dirty module
function createDangerZone(position: THREE.Vector3, radius: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 16, 8);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff4444,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.copy(position);
  return sphere;
}

// Create compliance indicator icon above module
function createComplianceIndicator(position: THREE.Vector3, status: 'compliant' | 'warning' | 'violation'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  // Clear canvas
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 64, 64);
  
  // Draw status icon
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  switch (status) {
    case 'compliant':
      ctx.fillStyle = '#00ff00';
      ctx.fillText('✓', 32, 32);
      break;
    case 'warning':
      ctx.fillStyle = '#ffaa00';
      ctx.fillText('⚠', 32, 32);
      break;
    case 'violation':
      ctx.fillStyle = '#ff0000';
      ctx.fillText('✗', 32, 32);
      break;
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(position.x, position.y + 3, position.z); // Float above module
  sprite.scale.set(2, 2, 1);
  
  return sprite;
}

// Create corridor visualization between modules
function createCorridorVisualization(corridor: CorridorConnection): THREE.Group {
  const corridorGroup = new THREE.Group();
  
  // Create main corridor tube
  const start = new THREE.Vector3(...corridor.startPoint);
  const end = new THREE.Vector3(...corridor.endPoint);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  
  // Corridor tube geometry (1.5m diameter for crew passage)
  const geometry = new THREE.CylinderGeometry(0.75, 0.75, length, 8);
  
  // Material based on corridor validation
  let material: THREE.MeshBasicMaterial;
  switch (corridor.validationType) {
    case 'valid':
      material = new THREE.MeshBasicMaterial({ 
        color: 0x00aa00, 
        transparent: true, 
        opacity: 0.3,
        wireframe: false
      });
      break;
    case 'warning':
      material = new THREE.MeshBasicMaterial({ 
        color: 0xffaa00, 
        transparent: true, 
        opacity: 0.4,
        wireframe: false
      });
      break;
    case 'invalid':
      material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        transparent: true, 
        opacity: 0.2,
        wireframe: true
      });
      break;
  }
  
  const corridorMesh = new THREE.Mesh(geometry, material);
  
  // Position and orient corridor
  const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  corridorMesh.position.copy(center);
  
  // Rotate to align with connection direction
  const axis = new THREE.Vector3(0, 1, 0);
  direction.normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
  corridorMesh.quaternion.copy(quaternion);
  
  corridorGroup.add(corridorMesh);
  
  // Add connection points (airlocks/docking ports)
  const connectionPointGeometry = new THREE.SphereGeometry(0.3, 8, 6);
  const connectionMaterial = new THREE.MeshBasicMaterial({ 
    color: corridor.isValid ? 0x0066ff : 0xff6600,
    transparent: true,
    opacity: 0.8
  });
  
  const startConnection = new THREE.Mesh(connectionPointGeometry, connectionMaterial);
  startConnection.position.copy(start);
  corridorGroup.add(startConnection);
  
  const endConnection = new THREE.Mesh(connectionPointGeometry, connectionMaterial);
  endConnection.position.copy(end);
  corridorGroup.add(endConnection);
  
  // Add corridor label with distance
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, 256, 64);
  
  ctx.fillStyle = corridor.isValid ? '#00ff00' : '#ff6600';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${corridor.length.toFixed(1)}m corridor`, 128, 25);
  
  if (corridor.issue) {
    ctx.font = '12px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(corridor.issue, 128, 45);
  }
  
  const labelTexture = new THREE.CanvasTexture(canvas);
  const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
  const labelSprite = new THREE.Sprite(labelMaterial);
  labelSprite.position.copy(center);
  labelSprite.position.y += 2; // Float above corridor
  labelSprite.scale.set(4, 1, 1);
  
  corridorGroup.add(labelSprite);
  
  return corridorGroup;
}

// Create warning indicator for unconnected modules
function createUnconnectedIndicator(position: THREE.Vector3): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.fillRect(0, 0, 64, 64);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', 32, 32);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(position.x, position.y + 4, position.z);
  sprite.scale.set(2.5, 2.5, 1);
  
  return sprite;
}

// NASA Mission Duration Requirements Adjustment
function getNASARequirementMultiplier(missionDays: number): { 
  redundancy: number; 
  storage: number; 
  medical: number;
  exercise: number;
  description: string;
} {
  if (missionDays <= 30) {
    return {
      redundancy: 1.0,
      storage: 1.0, 
      medical: 1.0,
      exercise: 1.0,
      description: "Short-duration mission: Basic requirements"
    };
  } else {
    return {
      redundancy: 1.5, // 50% more redundancy for long missions
      storage: 2.0,    // Double storage for consumables
      medical: 1.3,    // Enhanced medical capability
      exercise: 1.2,   // More exercise equipment to combat muscle atrophy
      description: "Long-duration mission: Enhanced requirements for crew health"
    };
  }
}

// Enhanced corridor connection analysis for habitat connectivity
interface CorridorConnection {
  id: string;
  moduleA: string;
  moduleB: string;
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  length: number;
  isValid: boolean;
  validationType: 'valid' | 'warning' | 'invalid';
  issue?: string;
  segments: Array<{
    start: [number, number, number];
    end: [number, number, number];
    type: 'straight' | 'bend' | 'junction';
  }>;
}

function analyzeCorridorConnections(objects: HabitatObject[]): {
  corridors: CorridorConnection[];
  unconnectedModules: string[];
  connectionIssues: Array<{moduleA: string; moduleB: string; issue: string}>;
} {
  const corridors: CorridorConnection[] = [];
  const connections = new Set<string>();
  const connectionIssues: Array<{moduleA: string; moduleB: string; issue: string}> = [];

  // Find modules that should be connected (within reasonable distance)
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const moduleA = objects[i];
      const moduleB = objects[j];
      
      const distance = Math.sqrt(
        Math.pow(moduleA.position[0] - moduleB.position[0], 2) +
        Math.pow(moduleA.position[2] - moduleB.position[2], 2)
      );

      // Create corridors for modules within 50 meters (reasonable connection distance)
      if (distance <= 50 && distance > 2) {
        // Calculate connection points (center of closest faces)
        const deltaX = moduleB.position[0] - moduleA.position[0];
        const deltaZ = moduleB.position[2] - moduleA.position[2];
        
        const startPoint: [number, number, number] = [
          moduleA.position[0] + (deltaX > 0 ? moduleA.size.w_m/2 : -moduleA.size.w_m/2),
          moduleA.position[1],
          moduleA.position[2] + (deltaZ > 0 ? moduleA.size.l_m/2 : -moduleA.size.l_m/2)
        ];
        
        const endPoint: [number, number, number] = [
          moduleB.position[0] + (deltaX < 0 ? moduleB.size.w_m/2 : -moduleB.size.w_m/2),
          moduleB.position[1],
          moduleB.position[2] + (deltaZ < 0 ? moduleB.size.l_m/2 : -moduleB.size.l_m/2)
        ];

        // Validate connection based on NASA standards
        let isValid = true;
        let validationType: 'valid' | 'warning' | 'invalid' = 'valid';
        let issue = '';

        // Check connection length limits
        if (distance > 30) {
          isValid = false;
          validationType = 'invalid';
          issue = 'Corridor too long (>30m) - exceeds NASA standards';
        } else if (distance > 20) {
          validationType = 'warning';
          issue = 'Long corridor (>20m) - consider intermediate support';
        }

        // Check critical module proximity requirements
        const isCriticalA = ['AIRLOCK', 'HYGIENE', 'MEDICAL', 'ECLSS'].includes(moduleA.type);
        const isCriticalB = ['AIRLOCK', 'HYGIENE', 'MEDICAL', 'ECLSS'].includes(moduleB.type);

        if ((isCriticalA || isCriticalB) && distance > 15) {
          isValid = false;
          validationType = 'invalid';
          issue = 'Critical life support modules must be within 15m';
        }

        // Check minimum corridor clearance
        if (distance < 3) {
          validationType = 'warning';
          issue = 'Tight corridor - may restrict crew movement';
        }

        const corridor: CorridorConnection = {
          id: `corridor-${moduleA.id}-${moduleB.id}`,
          moduleA: moduleA.id,
          moduleB: moduleB.id,
          startPoint,
          endPoint,
          length: distance,
          isValid,
          validationType,
          issue,
          segments: [{
            start: startPoint,
            end: endPoint,
            type: 'straight'
          }]
        };

        corridors.push(corridor);
        connections.add(moduleA.id);
        connections.add(moduleB.id);

        if (!isValid || validationType !== 'valid') {
          connectionIssues.push({
            moduleA: moduleA.id,
            moduleB: moduleB.id,
            issue
          });
        }
      }
    }
  }

  // Find unconnected modules (isolated modules are a safety concern)
  const unconnectedModules = objects
    .filter(obj => !connections.has(obj.id))
    .map(obj => obj.id);

  return { corridors, unconnectedModules, connectionIssues };
}

// Analyze compliance status for all modules
function analyzeModuleCompliance(objects: HabitatObject[]): {
  violations: Array<{ moduleA: string, moduleB: string, distance: number, minDistance: number }>,
  moduleStatus: Record<string, 'compliant' | 'warning' | 'violation'>,
  dangerZones: Array<{ moduleId: string, position: THREE.Vector3, radius: number }>,
  corridorAnalysis: ReturnType<typeof analyzeCorridorConnections>
} {
  const violations: Array<{ moduleA: string, moduleB: string, distance: number, minDistance: number }> = [];
  const moduleStatus: Record<string, 'compliant' | 'warning' | 'violation'> = {};
  const dangerZones: Array<{ moduleId: string, position: THREE.Vector3, radius: number }> = [];
  
  // Initialize all modules as compliant
  objects.forEach(obj => {
    moduleStatus[obj.id] = 'compliant';
  });
  
  // Check for clean/dirty separation violations
  const cleanModules = objects.filter(obj => NASA_AREA_TYPES.CLEAN.includes(obj.type as any));
  const dirtyModules = objects.filter(obj => NASA_AREA_TYPES.DIRTY.includes(obj.type as any));
  
  // Create danger zones around dirty modules
  dirtyModules.forEach(dirty => {
    const position = new THREE.Vector3(dirty.position[0], dirty.position[1], dirty.position[2]);
    dangerZones.push({
      moduleId: dirty.id,
      position,
      radius: 3.0 // 3-meter separation zone
    });
  });
  
  // Check violations between clean and dirty areas
  cleanModules.forEach(clean => {
    dirtyModules.forEach(dirty => {
      const distance = Math.sqrt(
        Math.pow(clean.position[0] - dirty.position[0], 2) +
        Math.pow(clean.position[2] - dirty.position[2], 2)
      );
      
      const minDistance = 3.0; // NASA minimum separation distance
      
      if (distance < minDistance) {
        violations.push({
          moduleA: clean.id,
          moduleB: dirty.id,
          distance,
          minDistance
        });
        
        // Mark both modules with appropriate severity
        const severity = distance < minDistance * 0.5 ? 'violation' : 'warning';
        moduleStatus[clean.id] = severity;
        moduleStatus[dirty.id] = severity;
      } else if (distance < minDistance * 1.2) {
        // Close but acceptable - show warning
        if (moduleStatus[clean.id] === 'compliant') moduleStatus[clean.id] = 'warning';
        if (moduleStatus[dirty.id] === 'compliant') moduleStatus[dirty.id] = 'warning';
      }
    });
  });
  
  // Add corridor analysis to compliance check
  const corridorAnalysis = analyzeCorridorConnections(objects);
  
  return { violations, moduleStatus, dangerZones, corridorAnalysis };
}

// NASA-compatible object structure
interface HabitatObject {
  id: string;
  type: FunctionalType;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  size: {
    w_m: number;
    l_m: number;
    h_m: number;
  };
}

// Create starfield background for space environment
function createStarField(scene: THREE.Scene, seed: number = 42, starCount: number = 8000, far: number = 800) {
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  
  // Seeded random function for consistent star patterns
  const seedRandom = (seed: number) => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  let seedValue = seed;
  
  for (let i = 0; i < starCount; i++) {
    // Spherical distribution for natural star field
    const radius = far * 0.8 + (seedRandom(seedValue++) * far * 0.2);
    const theta = seedRandom(seedValue++) * Math.PI * 2;
    const phi = Math.acos(2 * seedRandom(seedValue++) - 1);
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    
    // Vary star brightness and color temperature
    const brightness = 0.3 + seedRandom(seedValue++) * 0.7;
    const temp = seedRandom(seedValue++);
    
    if (temp > 0.8) {
      // Blue-white stars
      colors[i * 3] = brightness * 0.8;
      colors[i * 3 + 1] = brightness * 0.9;
      colors[i * 3 + 2] = brightness;
    } else if (temp > 0.6) {
      // White stars
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;
    } else if (temp > 0.3) {
      // Yellow stars
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness * 0.9;
      colors[i * 3 + 2] = brightness * 0.7;
    } else {
      // Red stars
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness * 0.6;
      colors[i * 3 + 2] = brightness * 0.4;
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const material = new THREE.PointsMaterial({
    size: 2,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });
  
  const starField = new THREE.Points(geometry, material);
  scene.add(starField);
  
  return starField;
}

// 3D Scene Component
function ThreeScene({ 
  objects, 
  setObjects, 
  selectedId, 
  setSelectedId, 
  scenario,
  hoverPointRef, 
  isInitialized, 
  setIsInitialized,
  sceneRefs,
  onContextMenu
}: {
  objects: HabitatObject[];
  setObjects: React.Dispatch<React.SetStateAction<HabitatObject[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  scenario: Scenario;
  hoverPointRef: React.MutableRefObject<THREE.Vector3 | null>;
  isInitialized: boolean;
  setIsInitialized: (initialized: boolean) => void;
  sceneRefs: React.MutableRefObject<{
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    raycaster: THREE.Raycaster | null;
    plane: THREE.Plane | null;
  }>;
  onContextMenu: (x: number, y: number, objectId: string | null) => void;
}) {
  // Get environment colors and textures based on destination
  const getEnvironmentConfig = (destination: string) => {
    switch (destination) {
      case 'MARS_SURFACE':
        return {
          background: 0x8B4513,      // Mars brown sky
          ground: 0xCD853F,          // Sandy/rusty ground (fallback)
          grid: 0x8B4513,            // Brown grid
          ambientLight: 0xFFB366,    // Warm ambient light
          directionalLight: 0xFFDAB9, // Warm directional light
          groundTexture: '/textures/ground/mars_surface.webp',
          skyTexture: '/textures/skybox/sky.webp'
        };
      case 'LUNAR':
      case 'LUNAR_SURFACE':
        return {
          background: 0x111111,      // Dark lunar sky
          ground: 0x696969,          // Grey lunar surface (fallback)
          grid: 0x555555,            // Dark grey grid
          ambientLight: 0xCCCCCC,    // Cool ambient light
          directionalLight: 0xFFFFFF, // White directional light
          groundTexture: '/textures/ground/moon-surface-seamless-texture-background-closeup-moon-surface-texture-188679621.webp',
          skyTexture: '/textures/skybox/sky.webp'
        };
      case 'LEO':
      case 'SPACE_STATION':
        return {
          background: 0x000011,      // Deep space blue-black
          ground: 0x2F4F4F,          // Dark slate station floor (fallback)
          grid: 0x4682B4,            // Steel blue grid
          ambientLight: 0xE6F3FF,    // Cool white ambient
          directionalLight: 0xFFFFFF, // Bright white directional
          groundTexture: '/textures/ground/space-station-floor.jpg',
          skyTexture: '/textures/skybox/sky.webp'
        };
      case 'MARS_TRANSIT':
        return {
          background: 0x191970,      // Midnight blue space
          ground: 0x2F2F2F,          // Dark ship floor (fallback)
          grid: 0x4169E1,            // Royal blue grid
          ambientLight: 0xE0E6FF,    // Cool ambient
          directionalLight: 0xF0F8FF, // Alice blue directional
          groundTexture: '/textures/ground/ship-deck.jpg',
          skyTexture: '/textures/skybox/sky.webp'
        };
      case 'DEEP_SPACE':
        return {
          background: 0x000000,      // Pure black space
          ground: 0x1C1C1C,          // Very dark ship floor (fallback)
          grid: 0x663399,            // Purple grid
          ambientLight: 0xE6E6FA,    // Lavender ambient
          directionalLight: 0xFFFFFF, // Pure white directional
          groundTexture: '/textures/ground/deep-space-deck.jpg',
          skyTexture: '/textures/skybox/sky.webp'
        };
      default:
        return {
          background: 0x2d1b69,      // Default purple
          ground: 0xCD5C5C,          // Default red ground (fallback)
          grid: 0x8b4513,            // Default brown grid
          ambientLight: 0xFFFFFF,    // Default white ambient
          directionalLight: 0xFFFFFF, // Default white directional
          groundTexture: '/textures/ground/default-surface.jpg',
          skyTexture: '/textures/skybox/sky.webp'
        };
    }
  };

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const meshesRef = useRef(new Map<string, THREE.Mesh>());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const isDraggingObjectRef = useRef(false);
  const dragOffsetRef = useRef(new THREE.Vector3());
  const animationIdRef = useRef<number>();
  
  // Visual compliance system refs
  const violationLinesRef = useRef<THREE.Group>(new THREE.Group());
  const dangerZonesRef = useRef<THREE.Group>(new THREE.Group());
  const complianceIndicatorsRef = useRef<THREE.Group>(new THREE.Group());
  
  // Enhanced corridor system refs
  const corridorsRef = useRef<THREE.Group>(new THREE.Group());
  const unconnectedIndicatorsRef = useRef<THREE.Group>(new THREE.Group());
  
  // Refs to store current state values for event handlers
  const selectedIdRef = useRef(selectedId);
  const setSelectedIdRef = useRef(setSelectedId);
  const setObjectsRef = useRef(setObjects);

  // Camera control state - improved approach with fixed zoom
  const isMarsEnvironment = scenario.destination === 'MARS_SURFACE' || scenario.destination === 'MARS_TRANSIT';
  const initialCameraDistance = isMarsEnvironment ? 120 : 25;
  
  const cameraStateRef = useRef({
    isRotating: false,
    isPanning: false,
    isSpacePressed: false,
    previousMouse: { x: 0, y: 0 },
    spherical: new THREE.Spherical(initialCameraDistance, Math.PI / 4, 0),
    target: new THREE.Vector3(0, 0, 0),
    panSpeed: isMarsEnvironment ? 0.2 : 0.02,
    rotateSpeed: 0.005
  });

  // Keep refs updated with current values
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  
  useEffect(() => {
    setSelectedIdRef.current = setSelectedId;
  }, [setSelectedId]);
  
  useEffect(() => {
    setObjectsRef.current = setObjects;
  }, [setObjects]);

  // Initialize Three.js scene
  useEffect(() => {
    console.log('Initializing Three.js scene...');
    if (!mountRef.current) {
      console.log('Mount ref not ready');
      return;
    }

    try {
      // Get environment configuration based on destination
      const envConfig = getEnvironmentConfig(scenario.destination);
      
      // Scene setup with star field background
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000011); // Very dark blue-black space color
      sceneRef.current = scene;
      
      // Add star field instead of solid background
      const starField = createStarField(scene, 42, 6000, 600);

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75, 
        mountRef.current.clientWidth / mountRef.current.clientHeight, 
        0.1, 
        1000
      );
      cameraRef.current = camera;
      
      // Store camera ref for drag/drop calculations
      sceneRefs.current.camera = camera;

      // Position camera
      const state = cameraStateRef.current;
      camera.position.setFromSpherical(state.spherical).add(state.target);
      camera.lookAt(state.target);

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x2d1b69);
      rendererRef.current = renderer;
      
      // Store renderer ref for drag/drop calculations
      sceneRefs.current.renderer = renderer;
      
      // Store raycaster and plane refs for drag/drop calculations
      sceneRefs.current.raycaster = raycasterRef.current;
      
      // Initialize drag/drop plane properly for Mars terrain
      if (scenario.destination === 'MARS_SURFACE' || scenario.destination === 'MARS_TRANSIT') {
        // For Mars terrain, set up plane at ground level (Y=0) pointing upward
        planeRef.current = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        console.log('🔴 Initialized Mars drag/drop plane at Y=0');
      } else {
        // For other environments, use standard plane
        planeRef.current = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      }
      
      sceneRefs.current.plane = planeRef.current;

      // Add canvas to DOM
      mountRef.current.appendChild(renderer.domElement);
      
      // Initialize visual compliance system groups
      violationLinesRef.current = new THREE.Group();
      dangerZonesRef.current = new THREE.Group();
      complianceIndicatorsRef.current = new THREE.Group();
      
      // Initialize corridor system groups
      corridorsRef.current = new THREE.Group();
      unconnectedIndicatorsRef.current = new THREE.Group();
      
      scene.add(violationLinesRef.current);
      scene.add(dangerZonesRef.current);
      scene.add(complianceIndicatorsRef.current);
      scene.add(corridorsRef.current);
      scene.add(unconnectedIndicatorsRef.current);

      // Lighting with dynamic colors
      const ambientLight = new THREE.AmbientLight(envConfig.ambientLight, 0.4);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(envConfig.directionalLight, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Dynamic terrain based on destination - Mars terrain for Mars destinations
      if (scenario.destination === 'MARS_SURFACE' || scenario.destination === 'MARS_TRANSIT') {
        console.log('Loading Mars terrain for destination:', scenario.destination);
        
        // Create fallback terrain while loading 3D tiles - expanded habitat construction site (200m×200m)
        const fallbackGeometry = new THREE.PlaneGeometry(200, 200, 64, 64);
        const fallbackVertices = fallbackGeometry.attributes.position;
        
        // Add Mars-like height variation to fallback
        for (let i = 0; i < fallbackVertices.count; i++) {
          const x = fallbackVertices.getX(i);
          const z = fallbackVertices.getZ(i);
          const y = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5 + 
                   Math.sin(x * 0.1) * 0.5 + 
                   Math.random() * 0.3;
          fallbackVertices.setY(i, y);
        }
        fallbackGeometry.computeVertexNormals();
        
        const fallbackMaterial = new THREE.MeshLambertMaterial({ 
          color: envConfig.ground,
          side: THREE.DoubleSide
        });
        
        const fallbackTerrain = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
        // Rotate terrain to be horizontal (ground plane) and right-side up
        fallbackTerrain.rotation.x = -Math.PI / 2; // This should be correct for PlaneGeometry (facing up)
        fallbackTerrain.position.y = 0; // Ensure it's at ground level
        fallbackTerrain.receiveShadow = true;
        scene.add(fallbackTerrain);
        
        console.log('🟠 Mars fallback terrain created:', {
          position: fallbackTerrain.position,
          rotation: fallbackTerrain.rotation,
          rotationDegrees: {
            x: (fallbackTerrain.rotation.x * 180 / Math.PI),
            y: (fallbackTerrain.rotation.y * 180 / Math.PI),
            z: (fallbackTerrain.rotation.z * 180 / Math.PI)
          }
        });
        
        // Try to load NASA Mars 3D tiles
        (async () => {
          try {
            console.log('Attempting to load NASA Mars Science Laboratory data...');
            const tilesUrl = 'https://raw.githubusercontent.com/NASA-AMMOS/3DTilesSampleData/master/msl-dingo-gap/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize_tileset.json';
            
            // Test network access first
            const testResponse = await fetch(tilesUrl, { 
              mode: 'cors',
              method: 'HEAD'
            });
            
            if (testResponse.ok) {
              const { TilesRenderer } = await import('3d-tiles-renderer');
              
              console.log('NASA data accessible, loading 3D tiles...');
              const tiles = new TilesRenderer(tilesUrl);
              // Note: fetchOptions property may not exist in current version
              // tiles.fetchOptions.mode = 'cors';
              tiles.errorTarget = 12;
              
              tiles.addEventListener('load-tile-set', () => {
                console.log('✅ NASA Mars terrain loaded successfully!');
                
                // Position Mars terrain properly
                const sphere = new THREE.Sphere();
                tiles.getBoundingSphere(sphere);
                
                console.log('🔍 Mars terrain bounding sphere:', {
                  center: sphere.center,
                  radius: sphere.radius
                });
                
                if (sphere.radius > 0) {
                  // Scale terrain to be realistic for habitat construction site (200m x 200m area)
                  const desiredTerrainSize = 200; // 200 meters - expanded construction site for large scenarios
                  const scale = desiredTerrainSize / (sphere.radius * 2);
                  tiles.group.scale.setScalar(scale);
                  
                  // Position terrain at ground level (Y=0)
                  tiles.group.position.set(0, 0, 0);
                  
                  // CRITICAL: Ensure Mars terrain is oriented as horizontal ground plane (right-side up)
                  // NASA Mars data comes in Z-up orientation, we need to rotate it to Y-up and flip it right-side up
                  
                  // Rotate to horizontal and flip right-side up
                  tiles.group.rotation.set(Math.PI / 2, 0, 0); // Rotate X by +90 degrees to make it horizontal and right-side up
                  
                  // Hide fallback terrain
                  fallbackTerrain.visible = false;
                  
                  // Update the drag/drop plane to match the terrain position exactly
                  // Place the plane at the same Y level as the terrain (Y=0) pointing upward
                  planeRef.current = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                  
                  console.log('✅ Mars habitat site positioned:', {
                    scale: scale,
                    terrainSize: desiredTerrainSize + 'm (habitat construction site)',
                    position: tiles.group.position,
                    rotation: tiles.group.rotation,
                    rotationDegrees: {
                      x: (tiles.group.rotation.x * 180 / Math.PI),
                      y: (tiles.group.rotation.y * 180 / Math.PI), 
                      z: (tiles.group.rotation.z * 180 / Math.PI)
                    }
                  });
                }
              });
              
              tiles.addEventListener('load-error', (event: any) => {
                console.warn('Mars tile load error:', event.error?.message || 'Unknown');
                console.log('Continuing with fallback Mars terrain');
              });
              
              scene.add(tiles.group);
              
              // Store tiles reference for updates
              (scene as any).marsTiles = tiles;
              
            } else {
              console.warn('NASA data not accessible, using fallback Mars terrain');
            }
            
          } catch (error) {
            console.warn('Failed to load Mars 3D tiles:', error);
            console.log('Continuing with fallback Mars terrain');
          }
        })();
        
      } else {
        // Standard ground for non-Mars destinations - realistic habitat site size
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        
        // Create texture loader
        const textureLoader = new THREE.TextureLoader();
        
        // Try to load ground texture, fall back to color if texture fails
        let groundMaterial: THREE.MeshLambertMaterial;
        
        try {
          console.log(`Loading ground texture: ${envConfig.groundTexture}`);
          const texture = textureLoader.load(
            envConfig.groundTexture,
            // onLoad callback
            (texture) => {
              console.log('Ground texture loaded successfully');
              // Configure texture properties for single image (no tiling)
              texture.wrapS = THREE.ClampToEdgeWrapping;
              texture.wrapT = THREE.ClampToEdgeWrapping;
              texture.repeat.set(1, 1); // Single image, no repetition
              texture.minFilter = THREE.LinearMipmapLinearFilter;
              texture.magFilter = THREE.LinearFilter;
              texture.generateMipmaps = true;
              
              // Update the material to use the texture
              groundMaterial.map = texture;
              groundMaterial.needsUpdate = true;
            },
            // onProgress callback
            (progress) => {
              console.log('Loading ground texture progress:', progress);
            },
            // onError callback
            (error) => {
              console.warn('Failed to load ground texture, using fallback color:', error);
              // Material already created with fallback color, so no additional action needed
            }
          );
          
          // Create material with texture (will show fallback color until texture loads)
          groundMaterial = new THREE.MeshLambertMaterial({ 
            color: envConfig.ground,
            map: texture 
          });
        } catch (error) {
          console.warn('Error creating texture loader, using fallback color:', error);
          // Fallback to solid color if texture loading fails
          groundMaterial = new THREE.MeshLambertMaterial({ color: envConfig.ground });
        }
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
      }

      // Set appropriate background for environment
      scene.background = new THREE.Color(0x000000); // Simple black sky for space

      // Dynamic grid - expanded habitat construction site scale (200m×200m)
      const gridSize = 200; // Expanded 200m construction site for large scenarios
      const gridDivisions = 100; // 2m grid squares for optimal visibility
      const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, envConfig.grid, envConfig.grid);
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.3;
      
      // Ensure grid is positioned at ground level (Y=0)
      gridHelper.position.y = 0;
      
      scene.add(gridHelper);
      
      console.log(`Habitat site grid: ${gridSize}m × ${gridSize}m, ${gridDivisions} divisions (2m squares)`);

      // Mouse events
      function handleMouseDown(event: MouseEvent) {
        event.preventDefault();
        const state = cameraStateRef.current;
        
        // Space + left click for camera panning
        if (state.isSpacePressed && event.button === 0) {
          state.isPanning = true;
          state.previousMouse = { x: event.clientX, y: event.clientY };
          renderer.domElement.style.cursor = 'grabbing';
          return;
        }
        
        if (event.button === 0) { // Left click (normal object interaction)
          const rect = renderer.domElement.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          
          mouseRef.current.set(x, y);
          raycasterRef.current.setFromCamera(mouseRef.current, camera);
          
          const meshes = Array.from(meshesRef.current.values());
          const intersects = raycasterRef.current.intersectObjects(meshes);
          
          if (intersects.length > 0) {
            const clickedId = intersects[0].object.userData.id;
            setSelectedIdRef.current(clickedId);
            isDraggingObjectRef.current = true;
            const selectedMesh = intersects[0].object;
            const intersectionPoint = intersects[0].point;
            dragOffsetRef.current.copy(selectedMesh.position).sub(intersectionPoint);
          } else {
            setSelectedIdRef.current(null);
            state.isRotating = true;
            state.previousMouse = { x: event.clientX, y: event.clientY };
          }
        } else if (event.button === 2) { // Right click
          state.isPanning = true;
          state.previousMouse = { x: event.clientX, y: event.clientY };
        }
      }

      function handleMouseMove(event: MouseEvent) {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        mouseRef.current.set(x, y);
        
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const hit = new THREE.Vector3();
        raycasterRef.current.ray.intersectPlane(planeRef.current, hit);
        if (hoverPointRef) {
          hoverPointRef.current = hit.clone();
        }

        if (isDraggingObjectRef.current && selectedIdRef.current) {
          const selectedMesh = meshesRef.current.get(selectedIdRef.current);
          if (selectedMesh) {
            const groundHit = new THREE.Vector3();
            raycasterRef.current.ray.intersectPlane(planeRef.current, groundHit);
            const newPos = groundHit.add(dragOffsetRef.current);
            newPos.x = snap(newPos.x);
            newPos.z = snap(newPos.z);
            newPos.y = Math.max(1, newPos.y);
            selectedMesh.position.copy(newPos);
          }
          return;
        }

        const state = cameraStateRef.current;
        const deltaX = event.clientX - state.previousMouse.x;
        const deltaY = event.clientY - state.previousMouse.y;

        if (state.isRotating) {
          state.spherical.theta -= deltaX * state.rotateSpeed;
          state.spherical.phi += deltaY * state.rotateSpeed;
          // Restrict phi to prevent camera from going underground
          state.spherical.phi = Math.max(0.2, Math.min(Math.PI * 0.48, state.spherical.phi));
          
          // Update camera position and enforce ground plane constraint
          camera.position.setFromSpherical(state.spherical).add(state.target);
          
          // Prevent camera from going underground
          const minHeight = 2.0;
          if (camera.position.y < minHeight) {
            camera.position.y = minHeight;
            const clampedPosition = camera.position.clone().sub(state.target);
            state.spherical.setFromVector3(clampedPosition);
          }
          
          camera.lookAt(state.target);
          state.previousMouse = { x: event.clientX, y: event.clientY };
        } else if (state.isPanning) {
          const panVector = new THREE.Vector3();
          const right = new THREE.Vector3().crossVectors(camera.up, new THREE.Vector3().subVectors(state.target, camera.position).normalize());
          const up = new THREE.Vector3().crossVectors(right, new THREE.Vector3().subVectors(state.target, camera.position).normalize());
          
          panVector.addScaledVector(right, -deltaX * state.panSpeed);
          panVector.addScaledVector(up, deltaY * state.panSpeed);
          
          state.target.add(panVector);
          camera.position.add(panVector);
          state.previousMouse = { x: event.clientX, y: event.clientY };
        }
      }

      function handleMouseUp() {
        if (isDraggingObjectRef.current && selectedIdRef.current) {
          const selectedMesh = meshesRef.current.get(selectedIdRef.current);
          if (selectedMesh) {
            const pos = selectedMesh.position;
            setObjectsRef.current(prev => prev.map(obj => 
              obj.id === selectedIdRef.current 
                ? { ...obj, position: [pos.x, pos.y, pos.z] as [number, number, number] }
                : obj
            ));
          }
          isDraggingObjectRef.current = false;
        }
        
        const state = cameraStateRef.current;
        state.isRotating = false;
        state.isPanning = false;
        
        // Reset cursor based on space key state
        if (state.isSpacePressed) {
          renderer.domElement.style.cursor = 'move';
        } else {
          renderer.domElement.style.cursor = 'default';
        }
      }

      function handleWheel(event: WheelEvent) {
        event.preventDefault();
        const state = cameraStateRef.current;
        
        // Simple direct zoom - no sliding, no complex calculations
        const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
        
        // Set zoom limits based on environment
        const minZoom = isMarsEnvironment ? 8 : 5;
        const maxZoom = isMarsEnvironment ? 300 : 100;
        
        // Calculate new radius with constraints
        const oldRadius = state.spherical.radius;
        const newRadius = Math.max(minZoom, Math.min(maxZoom, oldRadius * zoomFactor));
        
        // Apply new radius directly
        state.spherical.radius = newRadius;
        
        // Update camera position - simple and direct
        camera.position.setFromSpherical(state.spherical).add(state.target);
        
        // Prevent camera from going underground
        const minHeight = 2.0;
        if (camera.position.y < minHeight) {
          camera.position.y = minHeight;
          const clampedPosition = camera.position.clone().sub(state.target);
          state.spherical.setFromVector3(clampedPosition);
        }
        
        camera.lookAt(state.target);
      }

      // Add event listeners
      renderer.domElement.addEventListener('mousedown', handleMouseDown);
      renderer.domElement.addEventListener('mousemove', handleMouseMove);
      renderer.domElement.addEventListener('mouseup', handleMouseUp);
      renderer.domElement.addEventListener('wheel', handleWheel);
      renderer.domElement.addEventListener('contextmenu', handleContextMenu);
      
      // Add keyboard event listeners for space key camera controls
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      // Keyboard event handlers
      function handleKeyDown(event: KeyboardEvent) {
        if (event.code === 'Space') {
          event.preventDefault();
          cameraStateRef.current.isSpacePressed = true;
          renderer.domElement.style.cursor = 'move';
        }
      }

      function handleKeyUp(event: KeyboardEvent) {
        if (event.code === 'Space') {
          event.preventDefault();
          cameraStateRef.current.isSpacePressed = false;
          cameraStateRef.current.isPanning = false;
          cameraStateRef.current.isRotating = false;
          renderer.domElement.style.cursor = 'default';
        }
      }

      // Handle right-click for context menu
      function handleContextMenu(event: MouseEvent) {
        event.preventDefault();
        
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        
        raycasterRef.current.setFromCamera(mouse, camera);
        const intersects = raycasterRef.current.intersectObjects(scene.children, true);
        
        let objectId = null;
        for (const intersect of intersects) {
          if (intersect.object.userData.id) {
            objectId = intersect.object.userData.id;
            break;
          }
        }
        
        onContextMenu(event.clientX, event.clientY, objectId);
      }

      // Animation loop
      function animate() {
        animationIdRef.current = requestAnimationFrame(animate);
        
        // Add subtle star twinkling animation
        if (starField) {
          const material = starField.material as THREE.PointsMaterial;
          material.opacity = 0.6 + 0.2 * Math.sin(Date.now() * 0.001);
        }
        
        // Enforce ground plane constraint every frame
        const minHeight = 2.0; // Minimum 2 meters above ground
        if (camera.position.y < minHeight) {
          camera.position.y = minHeight;
        }
        
        // Update Mars tiles if available
        if ((scene as any).marsTiles) {
          const tiles = (scene as any).marsTiles;
          tiles.setCamera(camera);
          tiles.setResolutionFromRenderer(camera, renderer);
          tiles.update();
        }
        
        renderer.render(scene, camera);
      }
      animate();

      // Resize handler
      function handleResize() {
        if (!mountRef.current) return;
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
      window.addEventListener('resize', handleResize);

      setIsInitialized(true);
      console.log('Three.js scene initialized successfully');

      // Cleanup function
      return () => {
        console.log('Cleaning up Three.js scene');
        window.removeEventListener('resize', handleResize);
        
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
        
        if (renderer.domElement) {
          renderer.domElement.removeEventListener('mousedown', handleMouseDown);
          renderer.domElement.removeEventListener('mousemove', handleMouseMove);
          renderer.domElement.removeEventListener('mouseup', handleMouseUp);
          renderer.domElement.removeEventListener('wheel', handleWheel);
          renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
        }
        
        // Remove keyboard event listeners
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        
        // Cleanup Mars tiles if available
        if ((sceneRef.current as any)?.marsTiles) {
          try {
            (sceneRef.current as any).marsTiles.dispose();
          } catch (error) {
            console.warn('Error disposing Mars tiles:', error);
          }
        }
        
        // Cleanup visual compliance elements
        violationLinesRef.current.clear();
        dangerZonesRef.current.clear();
        complianceIndicatorsRef.current.clear();
        
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        
        renderer.dispose();
      };

    } catch (error) {
      console.error('Error initializing Three.js:', error);
    }
  }, [scenario.destination, setIsInitialized]); // Only reinitialize when destination changes, not when objects change

  // Update objects in scene with compliance visualization
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;

    console.log('Updating objects in scene with compliance analysis, count:', objects.length);

    // Analyze compliance for all modules
    const complianceAnalysis = analyzeModuleCompliance(objects);
    
    // Remove existing meshes
    meshesRef.current.forEach((mesh) => {
      sceneRef.current!.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(material => material.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    meshesRef.current.clear();
    
    // Clear previous compliance visualization
    violationLinesRef.current.clear();
    dangerZonesRef.current.clear();
    complianceIndicatorsRef.current.clear();
    
    // Clear previous corridor visualization
    corridorsRef.current.clear();
    unconnectedIndicatorsRef.current.clear();

    // Add new meshes with compliance status
    objects.forEach((obj) => {
      const moduleConfig = MODULE_TYPES_3D[obj.type as keyof typeof MODULE_TYPES_3D];
      if (!moduleConfig) return;

      const isSelected = selectedId === obj.id;
      const complianceStatus = complianceAnalysis.moduleStatus[obj.id];
      
      // Create realistic geometry using our new system
      const geometry = createModuleGeometry(moduleConfig.geometry, obj.size);
      const material = createModuleMaterial(moduleConfig, isSelected, complianceStatus);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...obj.position);
      mesh.rotation.set(...(obj.rotation || [0, 0, 0]));
      mesh.scale.set(...(obj.scale || [1, 1, 1]));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { id: obj.id, type: obj.type };

      sceneRef.current!.add(mesh);
      meshesRef.current.set(obj.id, mesh);
      
      // Add compliance indicator above module (only for warnings and violations)
      if (complianceStatus !== 'compliant') {
        const position = new THREE.Vector3(...obj.position);
        const indicator = createComplianceIndicator(position, complianceStatus);
        complianceIndicatorsRef.current.add(indicator);
      }
    });
    
    // Add violation lines between non-compliant modules
    complianceAnalysis.violations.forEach(violation => {
      const moduleA = objects.find(o => o.id === violation.moduleA);
      const moduleB = objects.find(o => o.id === violation.moduleB);
      
      if (moduleA && moduleB) {
        const posA = new THREE.Vector3(...moduleA.position);
        const posB = new THREE.Vector3(...moduleB.position);
        posA.y += 1; // Raise line above ground
        posB.y += 1;
        
        const line = createViolationLine(posA, posB);
        violationLinesRef.current.add(line);
      }
    });
    
    // Add danger zones around dirty modules
    complianceAnalysis.dangerZones.forEach(zone => {
      const dangerZone = createDangerZone(zone.position, zone.radius);
      dangerZonesRef.current.add(dangerZone);
    });
    
    // Add corridor visualizations between connected modules
    complianceAnalysis.corridorAnalysis.corridors.forEach(corridor => {
      const corridorVisualization = createCorridorVisualization(corridor);
      corridorsRef.current.add(corridorVisualization);
    });
    
    // Add warning indicators for unconnected modules
    complianceAnalysis.corridorAnalysis.unconnectedModules.forEach(moduleId => {
      const module = objects.find(o => o.id === moduleId);
      if (module) {
        const position = new THREE.Vector3(...module.position);
        const indicator = createUnconnectedIndicator(position);
        unconnectedIndicatorsRef.current.add(indicator);
      }
    });
    
  }, [objects, selectedId, isInitialized]);

  return (
    <div ref={mountRef} className="w-full h-full bg-background">
      {!isInitialized && (
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading 3D Scene...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility functions for localStorage persistence
const loadFromStorage = (key: string, defaultValue: any): any => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from storage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to storage:`, error);
  }
};

export default function NASAHabitatBuilder3D() {
  // Storage keys for persistence
  const STORAGE_KEYS = {
    SCENARIO: 'nasa-habitat-scenario',
    OBJECTS: 'nasa-habitat-objects', 
    SELECTED_ID: 'nasa-habitat-selected-id',

    VALIDATION_RESULTS: 'nasa-habitat-validation-results',
    ACTIVE_TAB: 'nasa-habitat-active-tab'
  };

  // NASA Mission Scenario
  const [scenario, setScenario] = useState(() => 
    loadFromStorage(STORAGE_KEYS.SCENARIO, {
      crew_size: 4,
      mission_duration_days: 900,
      destination: 'MARS_TRANSIT' as const,
      fairing: FAIRINGS[2] // SLS Block-1
    })
  );
  
  // Habitat Configuration
  const [habitat, setHabitat] = useState({
    shape: 'CYLINDER' as const,
    levels: 2,
    dimensions: { 
      diameter_m: 6.5, 
      height_m: 12.0 
    },
    pressurized_volume_m3: 400,
    net_habitable_volume_m3: 300
  });
  
  const [objects, setObjects] = useState<HabitatObject[]>(() => 
    loadFromStorage(STORAGE_KEYS.OBJECTS, [])
  );
  const [selectedId, setSelectedId] = useState<string | null>(() => 
    loadFromStorage(STORAGE_KEYS.SELECTED_ID, null)
  );
  const [validationResults, setValidationResults] = useState<any>(() => 
    loadFromStorage(STORAGE_KEYS.VALIDATION_RESULTS, null)
  );
  const [loading, setLoading] = useState({ validation: false });
  const [showHelp, setShowHelp] = useState(false);
  const [nextId, setNextId] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // State for collapsible sections
  const [showNasaFunctional, setShowNasaFunctional] = useState(true);

  const [showNasaMission, setShowNasaMission] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showModuleInspector, setShowModuleInspector] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // New state for save/load functionality
  const [activeTab, setActiveTab] = useState<'design' | 'collections' | 'shapes' | 'analyses'>(() => 
    loadFromStorage(STORAGE_KEYS.ACTIVE_TAB, 'design')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    objectId: string | null;
  }>({ visible: false, x: 0, y: 0, objectId: null });
  
  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<HabitatObject | null>(null);
  
  // UI control states
  const [showCameraHelp, setShowCameraHelp] = useState(true);
  const [keyboardAction, setKeyboardAction] = useState<string | null>(null);
  

  const hoverPointRef = useRef<THREE.Vector3 | null>(null);

  // Initialize database
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  // Trigger canvas resize when sidebar toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100); // Small delay to ensure DOM has updated
    
    return () => clearTimeout(timer);
  }, [showSidebar]);

  // Persistence effects - save state to localStorage when it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.OBJECTS, objects);
  }, [objects]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SCENARIO, scenario);
  }, [scenario]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SELECTED_ID, selectedId);
  }, [selectedId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Handle any other click outside logic if needed
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard controls for selected objects
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!selectedId) return;
      
      // Skip if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Prevent default behavior for arrow keys to avoid page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }

      const moveStep = event.shiftKey ? 1.0 : 0.5; // Larger steps with Shift
      const rotateStep = event.shiftKey ? Math.PI / 4 : Math.PI / 8; // 45° or 22.5°

      let actionDescription = '';

      setObjects(prevObjects => 
        prevObjects.map(obj => {
          if (obj.id !== selectedId) return obj;

          const newObj = { ...obj };

          switch (event.code) {
            // Movement controls
            case 'ArrowLeft':
              newObj.position = [obj.position[0] - moveStep, obj.position[1], obj.position[2]];
              actionDescription = `Moving Left (${moveStep}m)`;
              break;
            case 'ArrowRight':
              newObj.position = [obj.position[0] + moveStep, obj.position[1], obj.position[2]];
              actionDescription = `Moving Right (${moveStep}m)`;
              break;
            case 'ArrowUp':
              if (event.ctrlKey) {
                // Ctrl + Up: Move up (Y axis)
                newObj.position = [obj.position[0], obj.position[1] + moveStep, obj.position[2]];
                actionDescription = `Moving Up (${moveStep}m)`;
              } else {
                // Up: Move forward (Z axis)
                newObj.position = [obj.position[0], obj.position[1], obj.position[2] - moveStep];
                actionDescription = `Moving Forward (${moveStep}m)`;
              }
              break;
            case 'ArrowDown':
              if (event.ctrlKey) {
                // Ctrl + Down: Move down (Y axis)
                newObj.position = [obj.position[0], obj.position[1] - moveStep, obj.position[2]];
                actionDescription = `Moving Down (${moveStep}m)`;
              } else {
                // Down: Move backward (Z axis)
                newObj.position = [obj.position[0], obj.position[1], obj.position[2] + moveStep];
                actionDescription = `Moving Backward (${moveStep}m)`;
              }
              break;

            // Rotation controls
            case 'KeyQ':
              // Q: Rotate left around Y axis
              const currentRotationY = obj.rotation?.[1] || 0;
              newObj.rotation = [obj.rotation?.[0] || 0, currentRotationY - rotateStep, obj.rotation?.[2] || 0];
              actionDescription = `Rotating Left (${Math.round(rotateStep * 180 / Math.PI)}°)`;
              break;
            case 'KeyE':
              // E: Rotate right around Y axis
              const currentRotationY2 = obj.rotation?.[1] || 0;
              newObj.rotation = [obj.rotation?.[0] || 0, currentRotationY2 + rotateStep, obj.rotation?.[2] || 0];
              actionDescription = `Rotating Right (${Math.round(rotateStep * 180 / Math.PI)}°)`;
              break;
            case 'KeyR':
              // R: Rotate around X axis (pitch up)
              const currentRotationX = obj.rotation?.[0] || 0;
              newObj.rotation = [currentRotationX + rotateStep, obj.rotation?.[1] || 0, obj.rotation?.[2] || 0];
              actionDescription = `Pitch Up (${Math.round(rotateStep * 180 / Math.PI)}°)`;
              break;
            case 'KeyF':
              // F: Rotate around X axis (pitch down)
              const currentRotationX2 = obj.rotation?.[0] || 0;
              newObj.rotation = [currentRotationX2 - rotateStep, obj.rotation?.[1] || 0, obj.rotation?.[2] || 0];
              actionDescription = `Pitch Down (${Math.round(rotateStep * 180 / Math.PI)}°)`;
              break;

            // Height controls (Y-axis movement)
            case 'KeyW':
              // W: Move up (height)
              newObj.position = [obj.position[0], obj.position[1] + moveStep, obj.position[2]];
              actionDescription = `Moving Up (${moveStep}m)`;
              break;
            case 'KeyS':
              // S: Move down (height)
              newObj.position = [obj.position[0], obj.position[1] - moveStep, obj.position[2]];
              actionDescription = `Moving Down (${moveStep}m)`;
              break;

            case 'KeyT':
              // T: Rotate around Z axis (roll left)
              const currentRotationZ = obj.rotation?.[2] || 0;
              newObj.rotation = [obj.rotation?.[0] || 0, obj.rotation?.[1] || 0, currentRotationZ - rotateStep];
              actionDescription = `Roll Left (${Math.round(rotateStep * 180 / Math.PI)}°)`;
              break;
            case 'KeyG':
              // G: Rotate around Z axis (roll right)
              const currentRotationZ2 = obj.rotation?.[2] || 0;
              newObj.rotation = [obj.rotation?.[0] || 0, obj.rotation?.[1] || 0, currentRotationZ2 + rotateStep];
              actionDescription = `Roll Right (${Math.round(rotateStep * 180 / Math.PI)}°)`;
              break;

            // Scale controls
            case 'Equal':
            case 'NumpadAdd':
              // + or =: Scale up
              if (event.ctrlKey) {
                const currentScale = obj.scale || [1, 1, 1];
                const scaleStep = 0.1;
                newObj.scale = [
                  Math.min(currentScale[0] + scaleStep, 3.0),
                  Math.min(currentScale[1] + scaleStep, 3.0),
                  Math.min(currentScale[2] + scaleStep, 3.0)
                ];
                actionDescription = `Scaling Up (${Math.round((newObj.scale[0]) * 100)}%)`;
              }
              break;
            case 'Minus':
            case 'NumpadSubtract':
              // - : Scale down
              if (event.ctrlKey) {
                const currentScale = obj.scale || [1, 1, 1];
                const scaleStep = 0.1;
                newObj.scale = [
                  Math.max(currentScale[0] - scaleStep, 0.2),
                  Math.max(currentScale[1] - scaleStep, 0.2),
                  Math.max(currentScale[2] - scaleStep, 0.2)
                ];
                actionDescription = `Scaling Down (${Math.round((newObj.scale[0]) * 100)}%)`;
              }
              break;

            // Reset controls
            case 'KeyX':
              // X: Reset rotation
              if (event.ctrlKey) {
                newObj.rotation = [0, 0, 0];
                actionDescription = 'Reset Rotation';
              }
              break;
            case 'KeyC':
              // C: Reset scale
              if (event.ctrlKey) {
                newObj.scale = [1, 1, 1];
                actionDescription = 'Reset Scale';
              }
              break;
          }

          return newObj;
        })
      );

      // Show visual feedback
      if (actionDescription) {
        setKeyboardAction(actionDescription);
        setTimeout(() => setKeyboardAction(null), 1500);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedId]);



  // Load design from collections
  const handleLoadDesign = useCallback((savedDesign: SavedDesign) => {
    const layout = savedDesign.layout;
    
    // Update scenario (with type casting to handle potential mismatches)
    setScenario((prev: Scenario) => ({
      ...prev,
      crew_size: layout.scenario.crew_size,
      mission_duration_days: layout.scenario.mission_duration_days,
      destination: layout.scenario.destination as any,
    }));
    
    // Convert layout modules to habitat objects
    const newObjects: HabitatObject[] = layout.modules.map((module) => ({
      id: module.id,
      type: module.type as FunctionalType,
      position: [...module.position, 0] as [number, number, number], // Add z coordinate
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      size: module.size
    }));
    
    setObjects(newObjects);
    setActiveTab('design');
    setValidationResults(null);
    
    alert(`Loaded design: ${savedDesign.name}`);
  }, []);

  // Generate unique ID for modules
  const generateId = useCallback((type: FunctionalType) => {
    const id = `${type.toLowerCase().replace('_', '-')}-${nextId}`;
    setNextId(prev => prev + 1);
    return id;
  }, [nextId]);

  // Convert to NASA Layout format
  const generateNASALayout = useCallback((): Layout => {
    // Use the same robust approach as the analysis page with proper defaults
    const safeScenario = {
      crew_size: scenario?.crew_size || 4,
      mission_duration_days: scenario?.mission_duration_days || 365,
      destination: scenario?.destination || "MARS_SURFACE",
      fairing: {
        name: scenario?.fairing?.name || "Falcon 9",
        inner_diameter_m: scenario?.fairing?.inner_diameter_m || 5.2,
        inner_height_m: scenario?.fairing?.inner_height_m || 13.1,
        shape: (scenario?.fairing?.shape === "CYLINDRICAL" ? "CYLINDER" : "CONE") as "CYLINDER" | "CONE"
      }
    };
    
    const safeHabitat = {
      shape: habitat?.shape || "CYLINDER",
      levels: habitat?.levels || 1,
      dimensions: habitat?.dimensions || {
        diameter_m: 6.5,
        height_m: 12
      },
      pressurized_volume_m3: habitat?.pressurized_volume_m3 || 400,
      net_habitable_volume_m3: habitat?.net_habitable_volume_m3 || 300
    };

    // Convert objects to NASA modules format with proper fallbacks
    const modules = objects.map((obj, index) => ({
      id: obj.id || `module-${index}`,
      type: obj.type || "CREW_SLEEP",
      level: 0,
      position: [obj.position?.[0] || 0, obj.position?.[2] || 0],
      size: {
        w_m: obj.size?.w_m || 2,
        l_m: obj.size?.l_m || 2,
        h_m: obj.size?.h_m || 2.1
      },
      rotation_deg: obj.rotation?.[1] ? (obj.rotation[1] * 180 / Math.PI) : 0,
      crew_capacity: obj.type === "CREW_SLEEP" ? 1 : undefined,
      equipment: []
    }));

    return {
      scenario: safeScenario,
      habitat: safeHabitat,
      modules,
      version: "1.0.0"
    };
  }, [scenario, habitat, objects]);

  // Save current design
  const handleSaveDesign = useCallback(async () => {
    const layoutData = generateNASALayout();
    const timestamp = new Date().toLocaleString();
    
    setIsSaving(true);
    try {
      const designId = await saveDesign({
        name: `Habitat Design ${timestamp}`,
        description: `Design with ${objects.length} modules for ${scenario.destination} mission`,
        layout: layoutData,
        tags: ['nasa', scenario.destination.toLowerCase(), `crew-${scenario.crew_size}`]
      });
      
      alert(`Design saved successfully! ID: ${designId}`);
    } catch (error) {
      console.error('Failed to save design:', error);
      alert('Failed to save design. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [objects, scenario, generateNASALayout]);

  // Quick save function for the UI button
  const quickSave = useCallback(async () => {
    if (objects.length === 0) {
      alert('No modules to save. Add some modules first.');
      return;
    }
    await handleSaveDesign();
  }, [objects, handleSaveDesign]);

  // Update the quickSave function to use handleSaveDesign

  // Store refs to 3D scene elements for drag/drop
  const sceneRefs = useRef<{
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    raycaster: THREE.Raycaster | null;
    plane: THREE.Plane | null;
  }>({
    camera: null,
    renderer: null,
    raycaster: null,
    plane: null
  });

  // Helper function to calculate 3D position from mouse coordinates
  const calculateDropPosition = useCallback((clientX: number, clientY: number): THREE.Vector3 | null => {
    const { camera, renderer, raycaster, plane } = sceneRefs.current;
    
    if (!camera || !renderer || !raycaster || !plane) {
      console.log('Scene not ready for drop calculation');
      return null;
    }

    // Calculate mouse position relative to the canvas
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    // Cast ray from camera to mouse position
    const mouse = new THREE.Vector2(x, y);
    raycaster.setFromCamera(mouse, camera);
    
    // Find intersection with ground plane
    const intersectionPoint = new THREE.Vector3();
    const intersected = raycaster.ray.intersectPlane(plane, intersectionPoint);
    
    return intersected ? intersectionPoint : null;
  }, []);

  // Handle drop on 3D canvas
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData("module") as FunctionalType;
    if (!type) return;

    const intersectionPoint = calculateDropPosition(e.clientX, e.clientY);
    if (!intersectionPoint) {
      console.log('Could not calculate drop position');
      return;
    }

    const id = generateId(type);
    const moduleConfig = MODULE_TYPES_3D[type as keyof typeof MODULE_TYPES_3D];
    const modulePreset = MODULE_PRESETS.find(p => p.type === type);
    
    if (!moduleConfig || !modulePreset) return;

    // Position the module at the intersection point, snapped to grid
    const position: [number, number, number] = [
      snap(intersectionPoint.x), 
      moduleConfig.size.height/2, // Place on ground surface
      snap(intersectionPoint.z)
    ];
    
    const newObject: HabitatObject = { 
      id, 
      type, 
      position, 
      rotation: [0, 0, 0], 
      scale: [1, 1, 1],
      size: modulePreset.defaultSize
    };
    
    console.log('Adding NASA module at:', position, 'from drop at:', { x: e.clientX, y: e.clientY });
    setObjects((prev) => [...prev, newObject]);
    setSelectedId(id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    
    // Update hover point during drag over for visual feedback
    const intersectionPoint = calculateDropPosition(e.clientX, e.clientY);
    if (intersectionPoint && hoverPointRef.current) {
      hoverPointRef.current.copy(intersectionPoint);
    }
  }

  // NASA Validation using real API (exact same approach as analysis page)
  const handleNASAValidation = async () => {
    setLoading(prev => ({ ...prev, validation: true }));
    try {
      const layoutData = generateNASALayout();
      console.log('🚀 Sending to NASA API via postAnalyzeRaw:', layoutData);
      
      // Use the same postAnalyzeRaw function as the analysis page
      const result = await postAnalyzeRaw(layoutData);
      console.log('🎉 NASA Analysis Result from postAnalyzeRaw:', result);
      
      setValidationResults(result);
      
    } catch (error: any) {
      console.error('NASA validation failed:', error);
      
      // Set error result in same format as analysis page
      setValidationResults({
        results: [{
          rule: 'system.api_connection',
          valid: false,
          explanation: `NASA API connection failed: ${error.message}`
        }],
        suggestions: [
          'Check your internet connection',
          'The NASA API might be temporarily unavailable',
          'Try refreshing the page and running validation again'
        ]
      });
    }
    setLoading(prev => ({ ...prev, validation: false }));
  };

  // Export NASA JSON
  const exportNASAJSON = () => {
    const data = generateNASALayout();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nasa-habitat-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear layout
  const clearLayout = () => {
    setObjects([]);
    setValidationResults(null);
    setSelectedId(null);
  };

  // Context menu functions
  const deleteObject = useCallback((objectId: string) => {
    setObjects(prev => prev.filter(obj => obj.id !== objectId));
    if (selectedId === objectId) {
      setSelectedId(null);
    }
    setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
  }, [selectedId]);

  const duplicateObject = useCallback((objectId: string) => {
    const objectToDuplicate = objects.find(obj => obj.id === objectId);
    if (!objectToDuplicate) return;

    const id = generateId(objectToDuplicate.type);
    const newObject: HabitatObject = {
      ...objectToDuplicate,
      id,
      position: [
        objectToDuplicate.position[0] + 2, // Offset by 2 meters
        objectToDuplicate.position[1],
        objectToDuplicate.position[2] + 2
      ]
    };

    setObjects(prev => [...prev, newObject]);
    setSelectedId(id);
    setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
  }, [objects, generateId]);

  const copyObject = useCallback((objectId: string) => {
    const objectToCopy = objects.find(obj => obj.id === objectId);
    if (objectToCopy) {
      setClipboard(objectToCopy);
    }
    setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
  }, [objects]);

  const pasteObject = useCallback(() => {
    if (!clipboard) return;

    const id = generateId(clipboard.type);
    const newObject: HabitatObject = {
      ...clipboard,
      id,
      position: [
        clipboard.position[0] + 2, // Offset by 2 meters
        clipboard.position[1],
        clipboard.position[2] + 2
      ]
    };

    setObjects(prev => [...prev, newObject]);
    setSelectedId(id);
    setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
  }, [clipboard, generateId]);

  const resizeObject = useCallback((objectId: string, scale: number) => {
    setObjects(prev => prev.map(obj => {
      if (obj.id === objectId) {
        const currentScale = obj.scale || [1, 1, 1];
        return {
          ...obj,
          scale: [currentScale[0] * scale, currentScale[1] * scale, currentScale[2] * scale]
        };
      }
      return obj;
    }));
    setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId) {
        deleteObject(selectedId);
      } else if (e.ctrlKey && e.key === 'c' && selectedId) {
        copyObject(selectedId);
      } else if (e.ctrlKey && e.key === 'v' && clipboard) {
        pasteObject();
      } else if (e.ctrlKey && e.key === 'd' && selectedId) {
        e.preventDefault();
        duplicateObject(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, clipboard, deleteObject, copyObject, pasteObject, duplicateObject]);

  // Handle global click to hide context menu
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [contextMenu.visible]);







  // Create a new empty design
  const createNewDesign = () => {
    // Clear existing objects
    setObjects([]);
    setSelectedId(null);
    
    // Reset scenario to defaults
    setScenario({
      crew_size: 4,
      mission_duration_days: 365,
      destination: 'mars',
      fairing: 'falcon_heavy'
    });
    
    // Add a sample module to get started
    const id = generateId('CREW_SLEEP');
    const modulePreset = MODULE_PRESETS.find(p => p.type === 'CREW_SLEEP');
    if (modulePreset) {
      const newObject: HabitatObject = {
        id,
        type: 'CREW_SLEEP',
        position: [0, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        size: modulePreset.defaultSize
      };
      setObjects([newObject]);
      setSelectedId(id);
    }
    
    // Redirect to design tab
    setActiveTab('design');
    
    alert('New design created! Added a crew sleep module to get you started.');
  };

  // Add sample NASA modules
  const addSampleModule = () => {
    const sampleTypes: FunctionalType[] = ['CREW_SLEEP', 'HYGIENE', 'FOOD_PREP', 'EXERCISE'];
    sampleTypes.forEach((type, index) => {
      const id = generateId(type);
      const modulePreset = MODULE_PRESETS.find(p => p.type === type);
      if (!modulePreset) return;
      
      const newObject: HabitatObject = {
        id,
        type,
        position: [index * 3 - 4.5, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        size: modulePreset.defaultSize
      };
      setObjects(prev => [...prev, newObject]);
    });
  };

  const selectedObject = objects.find(obj => obj.id === selectedId);

  return (
    <div className="w-full h-screen bg-background text-foreground space-gradient flex flex-col">
      {/* Header */}
      <header className="nav-container shadow-2xl">
        <div className="flex items-center justify-between p-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                NASA Habitat Designer
              </h1>
              <p className="text-xs text-muted-foreground">Professional space habitat layout tool</p>
            </div>
          </div>
          
          {/* Main Navigation Menu */}
          <nav className="flex items-center gap-1">
            <Button 
              onClick={() => setActiveTab('design')} 
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'design' 
                  ? 'bg-primary text-primary-foreground border-primary/50 shadow-lg' 
                  : 'bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground'
              } border`}
            >
              <Eye className="w-4 h-4" />
              <span className="font-medium">Design Area</span>
            </Button>
            

            <Button 
              onClick={() => setActiveTab('collections')} 
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'collections' 
                  ? 'bg-primary text-primary-foreground border-primary/50 shadow-lg' 
                  : 'bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground'
              } border`}
            >
              <Folder className="w-4 h-4" />
              <span className="font-medium">Collections</span>
            </Button>
            
            <Button 
              onClick={() => setActiveTab('analyses')} 
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'analyses' 
                  ? 'bg-primary text-primary-foreground border-primary/50 shadow-lg' 
                  : 'bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground'
              } border`}
            >
              <Lightbulb className="w-4 h-4" />
              <span className="font-medium">Analyses</span>
            </Button>
            
            <div className="w-px h-8 bg-border mx-2"></div>
            
            <Button 
              onClick={quickSave}
              className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 bg-green-600/80 hover:bg-green-600 text-white border border-green-500/50 shadow-lg"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="font-medium">Save Project</span>
            </Button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button onClick={createNewDesign} className="btn-space px-3 py-2">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
            <Button onClick={clearLayout} className="btn-mars px-3 py-2">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex h-[calc(100vh-80px)]">
        {activeTab === 'design' ? (
          <div className="flex flex-1 relative h-full">
            {/* NASA Mission Control Sidebar */}
            {showSidebar && (
            <aside className="w-80 nav-container shadow-2xl border-r border-border flex flex-col overflow-y-auto h-full">
              {/* Sidebar Header with Toggle Button */}
              <div className="p-3 border-b border-border bg-card/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary to-blue-600 rounded-md flex items-center justify-center">
                      <Settings className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-semibold text-foreground">Mission Control</span>
                  </div>
                  <Button
                    onClick={() => setShowSidebar(false)}
                    className="w-8 h-8 p-0 rounded-lg hover:bg-accent"
                    title="Hide Sidebar"
                    variant="ghost"
                    size="sm"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Mission Scenario */}
          {/* Mission Scenario - Compact but Editable */}
          <div className="p-3 border-b border-border">
            <h3 
              className="font-semibold text-foreground mb-2 flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => setShowNasaMission(!showNasaMission)}
            >
              {showNasaMission ? (
                <Minus className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              NASA Mission Scenario
            </h3>
            {showNasaMission && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-muted-foreground text-xs">Crew</Label>
                  <Input
                    type="number"
                    value={scenario.crew_size}
                    onChange={(e) => setScenario((prev: Scenario) => ({
                      ...prev,
                      crew_size: parseInt(e.target.value) || 0
                    }))}
                    className="bg-background border-border text-foreground text-xs h-7 hover:bg-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Days</Label>
                  <Input
                    type="number"
                    value={scenario.mission_duration_days}
                    onChange={(e) => setScenario((prev: Scenario) => ({
                      ...prev,
                      mission_duration_days: parseInt(e.target.value) || 0
                    }))}
                    className="bg-background border-border text-foreground text-xs h-7 hover:bg-accent/50 transition-colors"
                  />
                  {/* NASA Duration-Based Requirements Indicator */}
                  <div className="text-[10px] mt-1">
                    {scenario.mission_duration_days <= 30 ? (
                      <span className="text-green-300">✓ Short Mission (≤30 days)</span>
                    ) : (
                      <span className="text-orange-300">⚠️ Long Mission ({'>'}30 days)</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Destination</Label>
                <select
                  value={scenario.destination}
                  onChange={(e) => setScenario((prev: Scenario) => ({
                    ...prev,
                    destination: e.target.value as any
                  }))}
                  className="w-full bg-background border border-border text-foreground text-xs h-7 rounded-md px-2 hover:bg-accent/50 transition-colors focus:ring-1 focus:ring-primary/50"
                >
                  <option value="LEO">Low Earth Orbit</option>
                  <option value="LUNAR">Lunar Surface</option>
                  <option value="MARS_TRANSIT">Mars Transit</option>
                  <option value="MARS_SURFACE">Mars Surface</option>
                  <option value="DEEP_SPACE">Deep Space</option>
                </select>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Launch Vehicle</Label>
                <select
                  value={scenario.fairing.name}
                  onChange={(e) => {
                    const fairing = FAIRINGS.find(f => f.name === e.target.value);
                    if (fairing) {
                      setScenario((prev: Scenario) => ({ ...prev, fairing }));
                    }
                  }}
                  className="w-full bg-background border border-border text-foreground text-xs h-7 rounded-md px-2 hover:bg-accent/50 transition-colors focus:ring-1 focus:ring-primary/50"
                >
                  {FAIRINGS.map(fairing => (
                    <option key={fairing.name} value={fairing.name}>
                      {fairing.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            )}
          </div>

          {/* NASA Functional Areas - Limited with Scroll */}
          <div className="p-3 border-b border-border">
            <h3 
              className="font-semibold text-foreground mb-2 flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => setShowNasaFunctional(!showNasaFunctional)}
            >
              {showNasaFunctional ? (
                <Minus className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              NASA Functional Areas
            </h3>
            {showNasaFunctional && (
              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {/* NASA Category Legend */}
                <div className="mb-3 text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-300">Clean Areas</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-orange-300">Dirty Areas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-300">Technical</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(MODULE_TYPES_3D).map(([type, config]) => {
                    const preset = MODULE_PRESETS.find(p => p.type === type as FunctionalType);
                    // Get NASA category color
                    const categoryColor = config.nasaCategory === 'CLEAN' ? 'border-green-500/60' :
                                        config.nasaCategory === 'DIRTY' ? 'border-orange-500/60' :
                                        'border-blue-500/60';
                    const categoryIndicator = config.nasaCategory === 'CLEAN' ? '🟢' :
                                            config.nasaCategory === 'DIRTY' ? '🟠' : '🔵';
                    return (
                      <div
                        key={type}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("module", type)}
                        className={`group flex flex-col items-center gap-2 p-2 bg-card/40 hover:bg-primary/20 border ${categoryColor} rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 backdrop-blur-sm hover:shadow-lg`}
                        title={`NASA ${config.nasaCategory} Area`}
                      >
                        <div className="relative">
                          <div 
                            className="w-8 h-8 rounded flex items-center justify-center text-white text-sm shadow-lg flex-shrink-0"
                            style={{ backgroundColor: config.color }}
                          >
                            {config.icon}
                          </div>
                          <div className="absolute -top-1 -right-1 text-xs">{categoryIndicator}</div>
                        </div>
                        <div className="text-center min-w-0 w-full">
                          <div className="font-medium text-foreground text-xs truncate">{preset?.label || type}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {preset?.defaultSize.w_m || config.size.width}×{preset?.defaultSize.h_m || config.size.height}×{preset?.defaultSize.l_m || config.size.depth}m
                          </div>
                          <div className="text-[9px] text-gray-400">
                            Min: {config.minDimensions.width}×{config.minDimensions.height}×{config.minDimensions.depth}m
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground text-center mt-2">
                  🟢 Clean: Food/Sleep/Medical • 🟠 Dirty: Exercise/Hygiene/Waste • 🔵 Technical: Systems/Storage
                </div>
              </div>
            )}
          </div>



          {/* NASA Compliance Assistant */}
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              NASA Assistant
            </h3>
            {(() => {
              const requirements = getNASARequirementMultiplier(scenario.mission_duration_days);
              const recommendations: string[] = [];
              
              // Check required modules
              const crewSleep = objects.filter(o => o.type === 'CREW_SLEEP').length;
              const hygiene = objects.filter(o => o.type === 'HYGIENE').length;
              const exercise = objects.filter(o => o.type === 'EXERCISE').length;
              const medical = objects.filter(o => o.type === 'MEDICAL').length;
              
              if (crewSleep < scenario.crew_size) {
                recommendations.push(`Add ${scenario.crew_size - crewSleep} more CREW_SLEEP modules`);
              }
              if (hygiene < Math.ceil(scenario.crew_size * requirements.redundancy)) {
                recommendations.push(`Add ${Math.ceil(scenario.crew_size * requirements.redundancy) - hygiene} more HYGIENE modules`);
              }
              if (exercise < Math.ceil(requirements.exercise)) {
                recommendations.push(`Add ${Math.ceil(requirements.exercise) - exercise} EXERCISE module`);
              }
              if (medical < Math.ceil(requirements.medical)) {
                recommendations.push(`Add ${Math.ceil(requirements.medical) - medical} MEDICAL module`);
              }
              
              return (
                <div className="space-y-2">
                  {recommendations.length > 0 ? (
                    <div className="text-xs space-y-1">
                      <div className="font-medium text-yellow-300">📋 Recommendations:</div>
                      {recommendations.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="text-gray-300 text-[10px]">• {rec}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-green-300">✅ All NASA requirements met!</div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Quick Actions & Custom Shapes */}
          <div className="p-3 border-b border-border">
            <h3 
              className="font-semibold text-foreground mb-2 flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => setShowQuickActions(!showQuickActions)}
            >
              {showQuickActions ? (
                <Minus className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Quick Actions
            </h3>
            {showQuickActions && (
            <div className="space-y-2">
              <Button 
                onClick={addSampleModule} 
                className="w-full btn-space text-xs py-2 h-8"
                size="sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Sample Module
              </Button>
              <Button 
                onClick={() => setActiveTab('shapes')} 
                className="w-full btn-space text-xs py-2 h-8"
                size="sm"
              >
                <Shapes className="w-3 h-3 mr-1" />
                Custom Shape Builder
              </Button>

            </div>
            )}
          </div>

          {/* Enhanced NASA Compliance Panel with Visual Controls */}
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              NASA Compliance Status
            </h3>
            <div className="space-y-2">
              {(() => {
                // Enhanced compliance analysis
                const complianceAnalysis = analyzeModuleCompliance(objects);
                const totalViolations = complianceAnalysis.violations.length;
                const totalCompliance = Math.max(0, 100 - (totalViolations * 15));
                const complianceColor = totalCompliance >= 80 ? 'text-green-400' :
                                      totalCompliance >= 60 ? 'text-yellow-400' : 'text-red-400';

                const statusCounts = {
                  compliant: Object.values(complianceAnalysis.moduleStatus).filter(s => s === 'compliant').length,
                  warning: Object.values(complianceAnalysis.moduleStatus).filter(s => s === 'warning').length,
                  violation: Object.values(complianceAnalysis.moduleStatus).filter(s => s === 'violation').length
                };

                return (
                  <div>
                    <div className={`text-lg font-bold ${complianceColor} flex items-center gap-2`}>
                      {totalCompliance}% Compliant
                      {totalCompliance === 100 && <span className="text-sm">🏆</span>}
                    </div>
                    
                    {/* Visual Legend */}
                    <div className="mt-2 p-2 bg-card/20 rounded border border-border">
                      <div className="text-xs text-gray-300 font-medium mb-1">3D Visual Indicators:</div>
                      <div className="space-y-1 text-[10px]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded"></div>
                          <span className="text-green-300">Compliant ({statusCounts.compliant})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded"></div>
                          <span className="text-orange-300">Warning ({statusCounts.warning})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-400 rounded"></div>
                          <span className="text-red-300">Violation ({statusCounts.violation})</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-gray-400 mt-2">
                        🔴 Red lines show separation violations
                        <br />🟠 Orange zones show 3m safety areas
                        <br />⚠️ Icons mark non-compliant modules
                      </div>
                    </div>
                    
                    {totalViolations > 0 && (
                      <div className="text-red-300 mt-2 p-2 bg-red-900/20 rounded border border-red-500/30">
                        <div className="font-medium text-xs">⚠️ {totalViolations} Active Violations:</div>
                        {complianceAnalysis.violations.slice(0, 2).map((violation, idx) => (
                          <div key={idx} className="text-[10px] ml-2 mt-1">
                            • {violation.distance.toFixed(1)}m separation (min: {violation.minDistance}m)
                          </div>
                        ))}
                        {complianceAnalysis.violations.length > 2 && (
                          <div className="text-[10px] text-gray-400 ml-2">
                            +{complianceAnalysis.violations.length - 2} more...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Enhanced Corridor Connections Panel */}
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-400" />
              Pressurized Corridors
            </h3>
            <div className="space-y-2">
              {(() => {
                const complianceAnalysis = analyzeModuleCompliance(objects);
                const corridorConnections = complianceAnalysis.corridorAnalysis?.corridors || [];
                const corridorStats = {
                  total: corridorConnections.length,
                  valid: corridorConnections.filter(c => c.validationType === 'valid').length,
                  warning: corridorConnections.filter(c => c.validationType === 'warning').length,
                  invalid: corridorConnections.filter(c => c.validationType === 'invalid').length,
                  unconnected: complianceAnalysis.corridorAnalysis?.unconnectedModules?.length || 0
                };

                const totalModules = objects.filter(obj => obj.userData?.isHabitatModule).length;
                const connectionRate = totalModules > 0 
                  ? Math.round(((totalModules - corridorStats.unconnected) / totalModules) * 100) 
                  : 0;

                return (
                  <div>
                    <div className="text-lg font-bold text-blue-300 flex items-center gap-2">
                      {connectionRate}% Connected
                      {connectionRate === 100 && corridorStats.invalid === 0 && <span className="text-sm">🚀</span>}
                    </div>
                    
                    {/* Corridor Statistics */}
                    <div className="mt-2 p-2 bg-card/20 rounded border border-border">
                      <div className="text-xs text-gray-300 font-medium mb-1">Connection Status:</div>
                      <div className="space-y-1 text-[10px]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded"></div>
                          <span className="text-green-300">Valid Corridors ({corridorStats.valid})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded"></div>
                          <span className="text-yellow-300">Long Corridors ({corridorStats.warning})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-400 rounded"></div>
                          <span className="text-red-300">Invalid Corridors ({corridorStats.invalid})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-500 rounded"></div>
                          <span className="text-gray-300">Unconnected Modules ({corridorStats.unconnected})</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-gray-400 mt-2">
                        🟢 &lt;15m optimal, 🟡 15-30m acceptable, 🔴 &gt;30m unsafe
                        <br />💡 1.5m diameter pressurized walkways
                        <br />🎯 Click modules to create connections
                      </div>
                    </div>

                    {/* Corridor Details */}
                    {corridorStats.total > 0 && (
                      <div className="mt-2 p-2 bg-blue-900/20 rounded border border-blue-500/30">
                        <div className="text-xs text-blue-300 font-medium mb-1">Active Connections:</div>
                        {corridorConnections.slice(0, 3).map((corridor, idx) => {
                          const moduleA = objects.find(obj => obj.id === corridor.moduleA);
                          const moduleB = objects.find(obj => obj.id === corridor.moduleB);
                          return (
                            <div key={idx} className="text-[10px] ml-2 mt-1 flex items-center gap-1">
                              <div className={`w-1 h-1 rounded ${
                                corridor.validationType === 'valid' ? 'bg-green-400' :
                                corridor.validationType === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                              }`}></div>
                              <span className="text-gray-300">
                                {moduleA?.type || corridor.moduleA} ↔ {moduleB?.type || corridor.moduleB} 
                                ({corridor.length.toFixed(1)}m)
                              </span>
                            </div>
                          );
                        })}
                        {corridorConnections.length > 3 && (
                          <div className="text-[10px] text-gray-400 ml-2 mt-1">
                            +{corridorConnections.length - 3} more corridors...
                          </div>
                        )}
                      </div>
                    )}

                    {corridorStats.unconnected > 0 && (
                      <div className="mt-2 p-2 bg-orange-900/20 rounded border border-orange-500/30">
                        <div className="text-xs text-orange-300 font-medium">
                          ⚠️ {corridorStats.unconnected} isolated module{corridorStats.unconnected > 1 ? 's' : ''} need connections
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Selected Module Inspector */}
          {selectedObject && (
            <div className="p-4 border-b border-border">
              <h3 
                className="font-semibold text-foreground mb-3 flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                onClick={() => setShowModuleInspector(!showModuleInspector)}
              >
                {showModuleInspector ? (
                  <Minus className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Module Inspector
              </h3>
              {showModuleInspector && (
              <div className="space-y-3">
                <div className="p-3 bg-card/40 border border-border rounded-lg">
                  <div className="font-medium text-foreground capitalize flex items-center gap-2">
                    <span className="text-lg">{MODULE_TYPES_3D[selectedObject.type as keyof typeof MODULE_TYPES_3D]?.icon}</span>
                    {MODULE_PRESETS.find(p => p.type === selectedObject.type)?.label}
                  </div>
                  {(() => {
                    const config = MODULE_TYPES_3D[selectedObject.type as keyof typeof MODULE_TYPES_3D];
                    const categoryColor = config?.nasaCategory === 'CLEAN' ? 'text-green-300' :
                                        config?.nasaCategory === 'DIRTY' ? 'text-orange-300' : 'text-blue-300';
                    return (
                      <div className="text-xs text-muted-foreground mt-1 space-y-1">
                        <div className={`${categoryColor} font-medium`}>
                          NASA {config?.nasaCategory} Area
                        </div>
                        <div>Position: ({selectedObject.position[0].toFixed(1)}m, {selectedObject.position[1].toFixed(1)}m, {selectedObject.position[2].toFixed(1)}m)</div>
                        <div>Volume: {(selectedObject.size.w_m * selectedObject.size.l_m * selectedObject.size.h_m).toFixed(1)}m³</div>
                        <div>Area: {(selectedObject.size.w_m * selectedObject.size.l_m).toFixed(1)}m²</div>
                        {config?.minDimensions && (
                          <div className="text-yellow-300">
                            NASA Min: {config.minDimensions.width}×{config.minDimensions.height}×{config.minDimensions.depth}m
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={() => {
                    setObjects((prev) => prev.filter((o) => o.id !== selectedId));
                    setSelectedId(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 border border-destructive/30 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Module
                </button>
              </div>
              )}
            </div>
          )}

          {/* Enhanced Mission Status with NASA Requirements */}
          <div className="p-4 border-b border-purple-500/20">
            <h3 className="font-semibold text-purple-300 mb-3">Mission Status</h3>
            <div className="space-y-2">
              <div className="text-sm text-gray-300">
                Modules: <span className="font-medium text-purple-300">{objects.length}</span>
              </div>
              <div className="text-sm text-gray-300">
                Total Volume: <span className="font-medium text-purple-300">
                  {objects.reduce((acc, obj) => acc + (obj.size.w_m * obj.size.l_m * obj.size.h_m), 0).toFixed(1)}m³
                </span>
              </div>
              
              {/* NASA Requirements Summary */}
              {(() => {
                const requirements = getNASARequirementMultiplier(scenario.mission_duration_days);
                const requiredModules = {
                  CREW_SLEEP: scenario.crew_size,
                  HYGIENE: Math.ceil(scenario.crew_size * requirements.redundancy),
                  EXERCISE: Math.ceil(requirements.exercise),
                  MEDICAL: Math.ceil(requirements.medical),
                  STOWAGE: Math.ceil(scenario.crew_size * requirements.storage)
                };
                
                const currentModules = {
                  CREW_SLEEP: objects.filter(o => o.type === 'CREW_SLEEP').length,
                  HYGIENE: objects.filter(o => o.type === 'HYGIENE').length,
                  EXERCISE: objects.filter(o => o.type === 'EXERCISE').length,
                  MEDICAL: objects.filter(o => o.type === 'MEDICAL').length,
                  STOWAGE: objects.filter(o => o.type === 'STOWAGE').length
                };
                
                const compliance = Object.entries(requiredModules).map(([type, required]) => {
                  const current = currentModules[type as keyof typeof currentModules];
                  return { type, required, current, ratio: current / required };
                });

                const overallCompliance = compliance.reduce((acc, c) => acc + Math.min(1, c.ratio), 0) / compliance.length * 100;

                return (
                  <div className="mt-3 p-2 bg-card/20 rounded border border-border">
                    <div className="text-xs text-gray-300 mb-2">
                      <span className="font-medium text-purple-200">NASA Compliance:</span>
                      <span className={`ml-2 font-bold ${overallCompliance >= 80 ? 'text-green-300' : 
                                      overallCompliance >= 60 ? 'text-yellow-300' : 'text-red-300'}`}>
                        {overallCompliance.toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 space-y-1">
                      {compliance.map(c => (
                        <div key={c.type} className="flex justify-between">
                          <span>{c.type}:</span>
                          <span className={c.current >= c.required ? 'text-green-300' : 'text-red-300'}>
                            {c.current}/{c.required}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-2 italic">
                      {requirements.description}
                    </div>
                  </div>
                );
              })()}
              
              <div className="text-sm text-gray-300">
                3D Engine: <span className="font-medium text-green-300">
                  {isInitialized ? 'Active' : 'Loading...'}
                </span>
              </div>
            </div>
          </div>
        </aside>
        )}

        {/* Show Sidebar Button - when hidden */}
        {!showSidebar && (
          <Button
            onClick={() => setShowSidebar(true)}
            className="absolute top-4 left-4 z-50 w-8 h-8 p-0 rounded-lg bg-card border border-border hover:bg-accent shadow-lg"
            title="Show Sidebar"
            variant="ghost"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
        )}

        {/* 3D Canvas */}
        <main
          className="flex-1 relative h-full overflow-hidden"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <ThreeScene
            objects={objects}
            setObjects={setObjects}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            scenario={scenario}
            hoverPointRef={hoverPointRef}
            isInitialized={isInitialized}
            setIsInitialized={setIsInitialized}
            sceneRefs={sceneRefs}
            onContextMenu={(x, y, objectId) => {
              setContextMenu({ visible: true, x, y, objectId });
            }}
          />

          {/* Enhanced NASA Mission Info with Compliance Status */}
          <div className="absolute top-6 right-6 glass-morphism rounded-xl p-4 shadow-2xl border border-blue-500/30 glow-blue">
            <div className="text-sm space-y-2">
              <div className="font-medium text-blue-300 flex items-center gap-2 text-shadow">
                <Settings className="w-4 h-4" />
                {scenario.destination.replace('_', ' ')}
              </div>
              <div className="text-xs text-gray-300 space-y-1 text-shadow-sm">
                <div>Crew: {scenario.crew_size} members</div>
                <div>Duration: {scenario.mission_duration_days} days</div>
                <div>Vehicle: {scenario.fairing.name}</div>
                <div>Modules: {objects.length}</div>
                
                {/* Live Compliance Status */}
                {(() => {
                  const complianceAnalysis = analyzeModuleCompliance(objects);
                  const totalViolations = complianceAnalysis.violations.length;
                  const compliance = Math.max(0, 100 - (totalViolations * 15));
                  
                  return (
                    <div className={`flex items-center gap-2 ${
                      compliance >= 80 ? 'text-green-300' : 
                      compliance >= 60 ? 'text-yellow-300' : 'text-red-300'
                    }`}>
                      {compliance >= 80 ? '✅' : compliance >= 60 ? '⚠️' : '❌'}
                      NASA: {compliance}% Compliant
                    </div>
                  );
                })()}
                
                {(scenario.destination === 'MARS_SURFACE' || scenario.destination === 'MARS_TRANSIT') && (
                  <div className="text-orange-300">
                    🔴 Mars Terrain: NASA MSL Data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Camera Controls Help */}
          {showCameraHelp && (
            <div className="absolute bottom-6 right-6 glass-morphism rounded-xl p-3 shadow-2xl border border-purple-500/30 glow-purple max-w-[220px]">
              <div className="text-xs space-y-2">
                <div className="font-medium text-purple-300 flex items-center justify-between text-shadow">
                  <div className="flex items-center gap-2">
                    <Camera className="w-3 h-3" />
                    Controls
                  </div>
                  <button 
                    onClick={() => setShowCameraHelp(false)}
                    className="text-gray-400 hover:text-white transition-colors text-xs"
                  >
                    ×
                  </button>
                </div>
                
                <div className="text-gray-300 text-shadow-sm space-y-1">
                  <div className="text-[10px] font-medium text-purple-200">Camera:</div>
                  <div className="text-[10px]">• <kbd className="bg-gray-800/50 px-1 rounded text-[9px]">Space</kbd> + Drag: Pan</div>
                  <div className="text-[10px]">• Mouse wheel: Zoom</div>
                </div>
                
                <div className="text-gray-300 text-shadow-sm space-y-1">
                  <div className="text-[10px] font-medium text-yellow-200">Objects (when selected):</div>
                  <div className="text-[10px]">• Arrow keys: Move X/Z • W/S: Height</div>
                  <div className="text-[10px]">• Q/E: Rotate • R/F/T/G: Pitch/Roll</div>
                  <div className="text-[10px]">• Hold Shift: Faster movement</div>
                </div>
              </div>
            </div>
          )}

          {selectedId && (
            <div className="absolute top-6 left-6 glass-morphism rounded-xl p-3 shadow-2xl border border-yellow-500/40 glow-orange max-w-[280px]">
              <div className="flex items-center gap-2 text-yellow-300 font-medium mb-2 text-shadow text-xs">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                Module Selected - Keyboard Controls
              </div>
              <div className="text-[10px] text-gray-300 space-y-1 text-shadow-sm">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">←→</kbd> Move X</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">↑↓</kbd> Move Z</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">W/S</kbd> Height</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">Q/E</kbd> Rotate Y</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">R/F</kbd> Pitch</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">T/G</kbd> Roll</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">Ctrl+±</kbd> Scale</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">Shift</kbd> Fast</div>
                </div>
                <div className="text-[9px] text-gray-400 mt-2 border-t border-gray-600/50 pt-1">
                  Ctrl+X: Reset rotation • Ctrl+C: Reset scale
                </div>
              </div>
            </div>
          )}

          {/* Keyboard Action Feedback */}
          {keyboardAction && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 backdrop-blur-sm border border-green-500/50 rounded-lg px-4 py-2 shadow-2xl animate-pulse">
              <div className="flex items-center gap-2 text-green-300 font-medium text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                {keyboardAction}
              </div>
            </div>
          )}
        </main>
          </div>
        ) : activeTab === 'collections' ? (
          <Collections
            currentLayout={generateNASALayout()}
            onLoadDesign={handleLoadDesign}
            onSaveSuccess={() => setActiveTab('design')}
          />
        ) : activeTab === 'shapes' ? (
          <ShapeBuilder />
        ) : activeTab === 'analyses' ? (
          <div className="flex-1 bg-gradient-to-br from-purple-950/20 via-transparent to-pink-950/20 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-purple-200 mb-2 flex items-center gap-3">
                  <Lightbulb className="w-8 h-8 text-purple-400" />
                  Habitat Analysis Center
                </h2>
                <p className="text-gray-400">Comprehensive analysis and validation tools for your habitat design</p>
              </div>
              
              {/* Real-time Metrics */}
              <MetricsHeader 
                nhv={habitat.net_habitable_volume_m3}
                pressurizedVolume={habitat.pressurized_volume_m3}
                utilization={Math.min(100, (objects.reduce((sum, obj) => sum + (obj.size.w_m * obj.size.l_m * obj.size.h_m), 0) / habitat.net_habitable_volume_m3) * 100)}
                corridorStatus={objects.length > 0 ? 'success' : 'danger'}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* NASA Validation Panel */}
                <Card className="glass-morphism border-purple-500/30 shadow-xl glow-purple">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-200">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      NASA Standards Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm">Validate your habitat design against NASA standards and requirements.</p>
                    <Button 
                      onClick={handleNASAValidation} 
                      disabled={loading.validation}
                      className="w-full btn-nasa"
                    >
                      {loading.validation ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Validating Design...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Run NASA Validation
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Analysis Panel */}
                <Card className="glass-morphism border-orange-500/30 shadow-xl glow-orange">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-200">
                      <Lightbulb className="w-5 h-5 text-orange-400" />
                      Quick Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-800/40 p-3 rounded-lg">
                        <div className="text-gray-400">Total Modules</div>
                        <div className="text-2xl font-bold text-orange-300">{objects.length}</div>
                      </div>
                      <div className="bg-gray-800/40 p-3 rounded-lg">
                        <div className="text-gray-400">Total Volume</div>
                        <div className="text-2xl font-bold text-orange-300">
                          {objects.reduce((sum, obj) => sum + (obj.size.w_m * obj.size.l_m * obj.size.h_m), 0).toFixed(1)}m³
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Professional NASA Analysis Results */}
              {validationResults && (
                <div className="mt-6">
                  <AnalysisResults 
                    data={validationResults} 
                    isLoading={loading.validation} 
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <ShapeBuilder />
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-gray-900 border border-gray-600 rounded-lg shadow-xl z-50 py-2 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            transform: 'translate(-50%, 0)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.objectId ? (
            <>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2"
                onClick={() => resizeObject(contextMenu.objectId!, 1.2)}
              >
                🔍 Zoom In (120%)
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2"
                onClick={() => resizeObject(contextMenu.objectId!, 0.8)}
              >
                🔎 Zoom Out (80%)
              </button>
              <hr className="border-gray-700 my-1" />
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2"
                onClick={() => duplicateObject(contextMenu.objectId!)}
              >
                📋 Duplicate
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2"
                onClick={() => copyObject(contextMenu.objectId!)}
              >
                📄 Copy
              </button>
              {clipboard && (
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2"
                  onClick={() => pasteObject()}
                >
                  📁 Paste
                </button>
              )}
              <hr className="border-gray-700 my-1" />
              <button
                className="w-full px-4 py-2 text-left hover:bg-red-800 text-sm text-red-300 flex items-center gap-2"
                onClick={() => deleteObject(contextMenu.objectId!)}
              >
                🗑️ Delete
              </button>
            </>
          ) : (
            clipboard && (
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2"
                onClick={() => pasteObject()}
              >
                📁 Paste
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}