import React, { useMemo, useCallback, useRef, useState } from 'react';
import useStore from '../store/useStore';
import { SceneObject, ShapeType } from '../types';
import { CubeIcon, SphereIcon, CylinderIcon, TorusIcon, ConeIcon, PlaneIcon, TrashIcon, MeshIcon, ChevronDownIcon } from './icons';

// Helper to get the correct icon for a given object type
const getIcon = (type: ShapeType) => {
  const props = { className: "w-4 h-4 mr-2.5 text-gray-400 flex-shrink-0" };
  switch (type) {
    case 'cube': return <CubeIcon {...props} />;
    case 'sphere': return <SphereIcon {...props} />;
    case 'cylinder': return <CylinderIcon {...props} />;
    case 'torus': return <TorusIcon {...props} />;
    case 'cone': return <ConeIcon {...props} />;
    case 'plane': return <PlaneIcon {...props} />;
    case 'model': return <MeshIcon {...props} />;
  }
};

const Vector3Input: React.FC<{ label: string; value: [string, string, string]; onChange: (newValue: [number, number, number]) => void; }> = ({ label, value, onChange }) => {
    const dragState = useRef({ active: false, initialX: 0, initialVal: 0, index: 0 });
    
    const handlePointerUp = useCallback(() => {
        if (!dragState.current.active) return;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        dragState.current.active = false;
    }, []);

    const handlePointerMove = useCallback((e: PointerEvent) => {
        if (!dragState.current.active) return;
        const { initialX, initialVal, index } = dragState.current;
        const deltaX = e.clientX - initialX;
        const sensitivity = label.includes('Rotation') ? 0.5 : 0.02;
        const rawNewValue = initialVal + deltaX * sensitivity;
        
        const step = label.includes('Rotation') ? 1 : 0.1;
        const precision = label.includes('Rotation') ? 1 : 2;
        const newValue = parseFloat(rawNewValue.toFixed(precision));

        const newValues = [...value];
        newValues[index] = newValue.toString();
        
        onChange(newValues.map(v => parseFloat(v) || 0) as [number, number, number]);
    }, [value, onChange, label, handlePointerUp]);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLSpanElement>, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        dragState.current = {
            active: true,
            initialX: e.clientX,
            initialVal: parseFloat(value[index]) || 0,
            index,
        };
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    }, [value, handlePointerMove, handlePointerUp]);

    const handleInputChange = (index: number, val: string) => {
        const num = parseFloat(val) || 0;
        const newValues = [...value];
        newValues[index] = num.toString();
        onChange(newValues.map(v => parseFloat(v) || 0) as [number, number, number]);
    };

    return (
        <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">{label}</label>
            <div className="grid grid-cols-3 gap-2">
                {['X', 'Y', 'Z'].map((axis, index) => (
                    <div key={axis} className="relative flex items-center">
                        <span 
                            onPointerDown={(e) => handlePointerDown(e, index)}
                            className={`absolute left-0 top-0 bottom-0 flex items-center justify-center w-5 text-xs font-mono text-white/40 select-none cursor-ew-resize bg-black/20 rounded-l-md border-r border-black/30`}
                        >
                            {axis}
                        </span>
                        <input
                            type="number"
                            step={label.includes('Rotation') ? 1 : 0.1}
                            value={value[index]}
                            placeholder={value[index] === 'Mixed' ? '—' : ''}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full bg-[#2a2a2a] border border-black/30 rounded-md pl-6 pr-1 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// New custom collapsible section component
const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; actions?: React.ReactNode; }> = ({ title, children, defaultOpen = false, actions }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="w-full border-b border-black/30">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-2 text-left text-xs font-bold text-gray-300 uppercase tracking-wider bg-black/10 hover:bg-black/20">
                <div className="flex items-center gap-2">
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                    <span>{title}</span>
                </div>
                {actions && <div onClick={e => e.stopPropagation()}>{actions}</div>}
            </button>
            {isOpen && <div className="p-3">{children}</div>}
        </div>
    );
};


const Inspector: React.FC = () => {
  const { objects, selectedObjectIds, setSelectedObjectIds, addToSelection, updateObjects, removeSelectedObjects } = useStore();
  
  const selectedObjects = useMemo(() => objects.filter(o => selectedObjectIds.includes(o.id)), [objects, selectedObjectIds]);

  const getCommonValue = useCallback(<T,>(prop: keyof SceneObject): T | 'Mixed' => {
      if (selectedObjects.length === 0) return null;
      const firstValue = selectedObjects[0][prop];
      for (let i = 1; i < selectedObjects.length; i++) {
        if (JSON.stringify(selectedObjects[i][prop]) !== JSON.stringify(firstValue)) return 'Mixed';
      }
      return firstValue as T;
  }, [selectedObjects]);
  
  const getVectorCommonValue = (prop: 'position' | 'scale' | 'rotation'): [string, string, string] => {
      if (selectedObjects.length === 0) return ['0', '0', '0'];
      const first = selectedObjects[0][prop];
      const isMixed = [false, false, false];
      for (let i = 1; i < selectedObjects.length; i++) {
          for (let j = 0; j < 3; j++) {
              if (selectedObjects[i][prop][j].toFixed(2) !== first[j].toFixed(2)) isMixed[j] = true;
          }
      }
      const format = (val: number, isRot: boolean) => isRot ? (val * (180 / Math.PI)).toFixed(1) : val.toFixed(2);
      const isRotation = prop === 'rotation';
      return [
          isMixed[0] ? 'Mixed' : format(first[0], isRotation),
          isMixed[1] ? 'Mixed' : format(first[1], isRotation),
          isMixed[2] ? 'Mixed' : format(first[2], isRotation),
      ];
  };

  const handleUpdate = (props: Partial<SceneObject>) => {
    if (selectedObjectIds.length > 0) {
      updateObjects(selectedObjectIds.map(id => ({ id, newProps: props })));
    }
  };

  return (
    <aside className="w-64 bg-[#252526] border-l border-black/30 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <CollapsibleSection 
          title="Scene Collection" 
          defaultOpen 
          actions={
            <button onClick={removeSelectedObjects} title="Delete Selected" className="p-1 text-gray-400 hover:text-red-400 disabled:text-gray-700" disabled={selectedObjectIds.length === 0}>
                <TrashIcon className="w-4 h-4"/>
            </button>
          }
        >
          <div className="space-y-0.5">
            {objects.map(obj => (
              <div
                key={obj.id}
                onClick={(e) => {
                  e.shiftKey ? addToSelection(obj.id) : setSelectedObjectIds([obj.id]);
                }}
                className={`flex items-center px-2 py-1.5 cursor-pointer text-sm rounded-md transition-colors ${selectedObjectIds.includes(obj.id) ? 'bg-cyan-500/20 text-cyan-200' : 'hover:bg-white/10 text-gray-300'}`}
              >
                {getIcon(obj.type)}
                <span className="flex-1 truncate capitalize">{obj.type}</span>
              </div>
            ))}
            {objects.length === 0 && <p className="text-xs text-gray-500 text-center px-2 py-4">Scene is empty.</p>}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Transform" defaultOpen>
          {selectedObjects.length > 0 ? (
            <div className="space-y-4">
              <Vector3Input label="Position" value={getVectorCommonValue('position')} onChange={(v) => handleUpdate({ position: v })} />
              <Vector3Input 
                  label="Rotation (°)" 
                  value={getVectorCommonValue('rotation')} 
                  onChange={(v) => handleUpdate({ rotation: v.map(d => d * (Math.PI / 180)) as [number, number, number]})} 
              />
              <Vector3Input label="Scale" value={getVectorCommonValue('scale')} onChange={(v) => handleUpdate({ scale: v })} />
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center pt-2">Select an object to inspect.</p>
          )}
        </CollapsibleSection>
        
        <CollapsibleSection title="Material">
             {selectedObjects.length > 0 ? (
                <div>
                  <label htmlFor="color" className="text-xs font-semibold text-gray-400 mb-1.5 block">Color</label>
                  <div className="relative">
                    <input 
                      id="color"
                      type="color"
                      value={getCommonValue<string>('color') === 'Mixed' ? '#ffffff' : getCommonValue<string>('color')}
                      onChange={(e) => handleUpdate({color: e.target.value})}
                      className="w-full h-8 p-0 border-none rounded-md bg-transparent cursor-pointer"
                      style={{ appearance: 'none', WebkitAppearance: 'none' }}
                    />
                    <div className="absolute inset-0 bg-[#2a2a2a] border border-black/30 rounded-md pointer-events-none flex items-center px-2">
                        <span className="text-sm font-mono">{getCommonValue<string>('color') === 'Mixed' ? 'Mixed' : getCommonValue<string>('color')}</span>
                    </div>
                  </div>
                </div>
             ) : (
                <p className="text-xs text-gray-500 text-center pt-2">Select an object to inspect.</p>
             )}
        </CollapsibleSection>
      </div>
    </aside>
  );
};

export default Inspector;
