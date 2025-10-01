import React, { useState, useCallback, useRef } from 'react';
import { DebugMarsViewer } from './DebugMarsViewer';
import { MarsTerrainErrorBoundary } from './MarsTerrainErrorBoundary';
import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trash2, Save, Download, Upload, RotateCw, Move } from 'lucide-react';

interface PlacedObject {
  id: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  type: string;
  name: string;
  scale: THREE.Vector3;
  color: string;
}

interface ObjectTemplate {
  type: string;
  name: string;
  color: string;
  defaultScale: THREE.Vector3;
  description: string;
}

const OBJECT_TEMPLATES: ObjectTemplate[] = [
  {
    type: 'habitat-module',
    name: 'Habitat Module',
    color: '#4a90e2',
    defaultScale: new THREE.Vector3(2, 2, 2),
    description: 'Main living quarters for astronauts'
  },
  {
    type: 'solar-panel',
    name: 'Solar Panel Array',
    color: '#2ecc71',
    defaultScale: new THREE.Vector3(3, 0.1, 1.5),
    description: 'Power generation system'
  },
  {
    type: 'communication-dish',
    name: 'Communication Dish',
    color: '#e74c3c',
    defaultScale: new THREE.Vector3(1.5, 2, 1.5),
    description: 'Earth communication system'
  },
  {
    type: 'rover-garage',
    name: 'Rover Garage',
    color: '#f39c12',
    defaultScale: new THREE.Vector3(2.5, 1.5, 3),
    description: 'Vehicle storage and maintenance'
  },
  {
    type: 'greenhouse',
    name: 'Greenhouse Module',
    color: '#27ae60',
    defaultScale: new THREE.Vector3(2, 2, 4),
    description: 'Food production facility'
  },
  {
    type: 'landing-pad',
    name: 'Landing Pad',
    color: '#95a5a6',
    defaultScale: new THREE.Vector3(4, 0.2, 4),
    description: 'Spacecraft landing area'
  }
];

export const MarsDesignArea: React.FC = () => {
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [selectedObjectType, setSelectedObjectType] = useState<string>(OBJECT_TEMPLATES[0].type);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [tilesRenderer, setTilesRenderer] = useState<TilesRenderer | null>(null);
  const [designName, setDesignName] = useState<string>('NASA Mars Base Design');
  const sceneObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());

  const handleTerrainLoad = useCallback(() => {
    console.log('Debug Mars terrain loaded successfully!');
  }, []);

  const createObjectMesh = useCallback((template: ObjectTemplate): THREE.Object3D => {
    const group = new THREE.Group();
    
    let geometry: THREE.BufferGeometry;
    
    switch (template.type) {
      case 'habitat-module':
        geometry = new THREE.CylinderGeometry(1, 1, 1, 8);
        break;
      case 'solar-panel':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'communication-dish':
        geometry = new THREE.ConeGeometry(1, 1, 8);
        break;
      case 'rover-garage':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'greenhouse':
        geometry = new THREE.CylinderGeometry(1, 1, 1, 6);
        break;
      case 'landing-pad':
        geometry = new THREE.CylinderGeometry(1, 1, 1, 16);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    
    const material = new THREE.MeshLambertMaterial({ 
      color: template.color,
      transparent: true,
      opacity: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    
    // Add wireframe outline
    const wireframe = new THREE.WireframeGeometry(geometry);
    const line = new THREE.LineSegments(wireframe, 
      new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.3, transparent: true })
    );
    group.add(line);
    
    return group;
  }, []);

  const handleObjectDrop = useCallback((position: THREE.Vector3, normal: THREE.Vector3) => {
    const template = OBJECT_TEMPLATES.find(t => t.type === selectedObjectType);
    if (!template) return;

    const newObject: PlacedObject = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: position.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      type: template.type,
      name: `${template.name} ${placedObjects.filter(o => o.type === template.type).length + 1}`,
      scale: template.defaultScale.clone(),
      color: template.color
    };
    
    // Create 3D object
    const object3D = createObjectMesh(template);
    object3D.position.copy(position);
    object3D.scale.copy(template.defaultScale);
    
    // Align with terrain normal for realistic placement
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal.normalize());
    object3D.setRotationFromQuaternion(quaternion);
    
    // Lift object slightly above surface based on its size
    const offset = normal.clone().multiplyScalar(template.defaultScale.y * 0.6);
    object3D.position.add(offset);
    
    sceneObjectsRef.current.set(newObject.id, object3D);
    setPlacedObjects(prev => [...prev, newObject]);
    console.log('Object placed on debug terrain:', newObject);
    
    // Dispatch custom event to add object to scene
    window.dispatchEvent(new CustomEvent('addObjectToScene', { 
      detail: { object3D, id: newObject.id } 
    }));
  }, [selectedObjectType, placedObjects, tilesRenderer, createObjectMesh]);

  const handleDeleteObject = useCallback((objectId: string) => {
    const object3D = sceneObjectsRef.current.get(objectId);
    if (object3D) {
      sceneObjectsRef.current.delete(objectId);
      // Dispatch custom event to remove object from scene
      window.dispatchEvent(new CustomEvent('removeObjectFromScene', { 
        detail: { objectId, object3D } 
      }));
    }
    
    setPlacedObjects(prev => prev.filter(obj => obj.id !== objectId));
    setSelectedObject(null);
  }, []);

  const handleClearAll = useCallback(() => {
    sceneObjectsRef.current.forEach((object3D, objectId) => {
      window.dispatchEvent(new CustomEvent('removeObjectFromScene', { 
        detail: { objectId, object3D } 
      }));
    });
    sceneObjectsRef.current.clear();
    
    setPlacedObjects([]);
    setSelectedObject(null);
  }, []);

  const handleSaveDesign = useCallback(() => {
    const designData = {
      name: designName,
      timestamp: new Date().toISOString(),
      objects: placedObjects.map(obj => ({
        ...obj,
        position: obj.position.toArray(),
        rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
        scale: obj.scale.toArray()
      }))
    };
    
    const dataStr = JSON.stringify(designData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${designName.replace(/\s+/g, '_')}_mars_base.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [designName, placedObjects]);

  const selectedTemplate = OBJECT_TEMPLATES.find(t => t.type === selectedObjectType);

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Sidebar - Object Library */}
      <div className="w-80 bg-gray-800 text-white p-4 overflow-y-auto">
        <Card className="bg-gray-700 border-gray-600 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">🚀 NASA Mars Base Designer</CardTitle>
            <p className="text-xs text-orange-300 mb-2">Real Mars Science Laboratory Data</p>
            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
              placeholder="Design name..."
            />
          </CardHeader>
        </Card>

        <Card className="bg-gray-700 border-gray-600 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">Object Library</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedObjectType} onValueChange={setSelectedObjectType}>
              <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                <SelectValue placeholder="Select object type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-600 border-gray-500">
                {OBJECT_TEMPLATES.map(template => (
                  <SelectItem key={template.type} value={template.type} className="text-white hover:bg-gray-500">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: template.color }}
                      />
                      <span>{template.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTemplate && (
              <div className="mt-3 p-3 bg-gray-600 rounded text-sm">
                <h4 className="font-semibold text-white">{selectedTemplate.name}</h4>
                <p className="text-gray-300 text-xs mt-1">{selectedTemplate.description}</p>
                <Badge 
                  className="mt-2"
                  style={{ backgroundColor: selectedTemplate.color }}
                >
                  Click terrain to place
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-700 border-gray-600 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">
              Placed Objects ({placedObjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {placedObjects.map(obj => (
                <div 
                  key={obj.id}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedObject === obj.id 
                      ? 'bg-blue-600' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  onClick={() => setSelectedObject(obj.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: obj.color }}
                      />
                      <span className="text-sm text-white truncate">{obj.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteObject(obj.id);
                      }}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {placedObjects.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  No objects placed yet.
                  <br />
                  Click on Mars terrain to place objects.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button 
            onClick={handleSaveDesign} 
            className="w-full"
            disabled={placedObjects.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Design
          </Button>
          
          <Button 
            onClick={handleClearAll} 
            variant="destructive" 
            className="w-full"
            disabled={placedObjects.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Main Design Area */}
      <div className="flex-1 relative">
        <MarsTerrainErrorBoundary>
          <DebugMarsViewer 
            onTerrainLoad={handleTerrainLoad}
            onObjectDrop={handleObjectDrop}
            className="w-full h-full"
          />
        </MarsTerrainErrorBoundary>
        
        {/* Stats Overlay */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm">
          <h4 className="font-semibold mb-2">Base Statistics</h4>
          <div className="space-y-1 text-xs">
            <div>Total Objects: {placedObjects.length}</div>
            <div>Habitat Modules: {placedObjects.filter(o => o.type === 'habitat-module').length}</div>
            <div>Power Systems: {placedObjects.filter(o => o.type === 'solar-panel').length}</div>
            <div>Communication: {placedObjects.filter(o => o.type === 'communication-dish').length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};