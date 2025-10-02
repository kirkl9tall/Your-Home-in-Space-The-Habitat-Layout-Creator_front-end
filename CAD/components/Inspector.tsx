import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { SceneObject, ObjectType, MaterialPreset, StarConfig } from '../types';
import { CubeIcon, SphereIcon, CylinderIcon, TorusIcon, ConeIcon, PlaneIcon, TrashIcon, MeshIcon, ChevronDownIcon, PyramidIcon, CapsuleIcon, GearIcon, GroupIcon, EyeOpenIcon, EyeClosedIcon, LockIcon, UnlockIcon, PlusCircleIcon, MaterialGoldIcon, MaterialSteelIcon, MaterialCopperIcon, MaterialPlasticIcon, MaterialRubberIcon, MaterialWoodIcon, MaterialGlassIcon, MaterialConcreteIcon, MaterialGemIcon, MaterialClayIcon, MaterialNeonIcon, TextIcon, StarIcon, HeartIcon, SvgIcon } from './icons';
import { toast } from './Toast';
import * as THREE from 'three';

const materialIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  gold: MaterialGoldIcon,
  steel: MaterialSteelIcon,
  copper: MaterialCopperIcon,
  plastic: MaterialPlasticIcon,
  rubber: MaterialRubberIcon,
  wood: MaterialWoodIcon,
  glass: MaterialGlassIcon,
  concrete: MaterialConcreteIcon,
  gem: MaterialGemIcon,
  clay: MaterialClayIcon,
  neon: MaterialNeonIcon,
};


const defaultMaterials: MaterialPreset[] = [
  { name: 'Polished Gold', icon: 'gold', color: '#FFD700', metalness: 1.0, roughness: 0.1, opacity: 1, transparent: false, emissiveColor: '#000000', emissiveIntensity: 0 },
  { name: 'Brushed Steel', icon: 'steel', color: '#CCCCCC', metalness: 0.8, roughness: 0.4, opacity: 1, transparent: false, emissiveColor: '#000000', emissiveIntensity: 0 },
  { name: 'Copper', icon: 'copper', color: '#B87333', metalness: 0.9, roughness: 0.25, opacity: 1, transparent: false, emissiveColor: '#000000', emissiveIntensity: 0 },
  { name: 'Red Plastic', icon: 'plastic', color: '#FF0000', metalness: 0.1, roughness: 0.6, opacity: 1, transparent: false, emissiveColor: '#000000', emissiveIntensity: 0 },
  { name: 'Matte Rubber', icon: 'rubber', color: '#222222', metalness: 0.0, roughness: 0.9, opacity: 1, transparent: false, emissiveColor: '#000000', emissiveIntensity: 0 },
  { name: 'Oak Wood', icon: 'wood', color: '#A06A42', metalness: 0.0, roughness: 0.85, opacity: 1, transparent: false, emissiveColor: '#000000', emissiveIntensity: 0 },
  { name: 'Clear Glass', icon: 'glass', color: '#EFFFFF', metalness: 0.1, roughness: 0.1, opacity: 0.2, transparent: true, emissiveColor: '#000000', emissiveIntensity: 0 },
  { name: 'Concrete', icon: 'concrete', color: '#808080', metalness: 0.0, roughness: 0.9, opacity: 1, transparent: false, emissiveColor: '#000000', emissiveIntensity: 0 },
  { name: 'Emerald', icon: 'gem', color: '#50C878', metalness: 0.2, roughness: 0.2, opacity: 0.7, transparent: true, emissiveColor: '#000000', emissiveIntensity: 0 },
  { name: 'Jade', icon: 'gem', color: '#00A86B', metalness: 0.1, roughness: 0.3, opacity: 1, transparent: false, emissiveColor: '#000000', emissiveIntensity: 0 },
  { name: 'Clay', icon: 'clay', color: '#D2B48C', metalness: 0.0, roughness: 1.0, opacity: 1, transparent: false, emissiveColor: '#000000', emissiveIntensity: 0 },
  { name: 'Cyber Neon', icon: 'neon', color: '#39ff14', metalness: 0.1, roughness: 0.3, opacity: 1, transparent: false, emissiveColor: '#39ff14', emissiveIntensity: 2.5 },
];


const getIcon = (type: ObjectType) => {
  const props = { className: "w-4 h-4 mr-2.5 text-gray-400 flex-shrink-0" };
  switch (type) {
    case 'cube': return <CubeIcon {...props} />;
    case 'sphere': return <SphereIcon {...props} />;
    case 'cylinder': return <CylinderIcon {...props} />;
    case 'torus': return <TorusIcon {...props} />;
    case 'cone': return <ConeIcon {...props} />;
    case 'plane': return <PlaneIcon {...props} />;
    case 'model': return <MeshIcon {...props} />;
    case 'pyramid': return <PyramidIcon {...props} />;
    case 'capsule': return <CapsuleIcon {...props} />;
    case 'gear': return <GearIcon {...props} />;
    case 'text': return <TextIcon {...props} />;
    case 'star': return <StarIcon {...props} />;
    case 'heart': return <HeartIcon {...props} />;
    case 'svg': return <SvgIcon {...props} />;
    case 'group': return <GroupIcon {...props} />;
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
        dragState.current = { active: true, initialX: e.clientX, initialVal: parseFloat(value[index]) || 0, index };
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
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 block">{label}</label>
            <div className="grid grid-cols-3 gap-2">
                {['X', 'Y', 'Z'].map((axis, index) => (
                    <div key={axis} className="relative flex items-center">
                        <span 
                            onPointerDown={(e) => handlePointerDown(e, index)}
                            className={`absolute left-0 top-0 bottom-0 flex items-center justify-center w-5 text-xs font-mono select-none cursor-ew-resize rounded-l-md border-r border-[var(--color-border)] 
                            ${axis === 'X' ? 'text-red-400' : axis === 'Y' ? 'text-green-400' : 'text-blue-400'}`}
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
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md pl-6 pr-1 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const SliderInput: React.FC<{ label: string; value: number | 'Mixed'; onChange: (newValue: number) => void; min?: number; max?: number; step?: number; }> = ({ label, value, onChange, min = 0, max = 1, step = 0.01 }) => {
    const displayValue = value === 'Mixed' ? '—' : Number(value).toFixed(2);
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</label>
                <span className="text-xs text-[var(--color-text-primary)] font-mono">{displayValue}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value === 'Mixed' ? (min + max) / 2 : value}
                onChange={e => onChange(parseFloat(e.target.value))}
                disabled={value === 'Mixed'}
                className="w-full h-1.5 bg-[var(--color-background)] rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                style={{
                    accentColor: 'var(--color-accent)',
                }}
            />
        </div>
    );
}

const CheckboxInput: React.FC<{ label: string; checked: boolean | 'Mixed'; onChange: (isChecked: boolean) => void; }> = ({ label, checked, onChange }) => {
    const isMixed = checked === 'Mixed';
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.indeterminate = isMixed;
        }
    }, [isMixed]);
    
    return (
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors select-none">
            <div className="relative flex items-center justify-center w-4 h-4">
                <input
                    ref={ref}
                    type="checkbox"
                    checked={isMixed ? false : !!checked}
                    onChange={e => onChange(e.target.checked)}
                    className="appearance-none w-4 h-4 rounded-sm bg-[var(--color-background)] border border-[var(--color-border)] checked:bg-[var(--color-accent)] checked:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-panel)] focus:ring-[var(--color-accent)] transition-all"
                />
                {checked === true && !isMixed && <svg className="absolute w-3 h-3 text-white pointer-events-none" viewBox="0 0 16 16" fill="currentColor"><path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"/></svg>}
                {isMixed && <div className="absolute w-2 h-0.5 bg-white/50 pointer-events-none" />}
            </div>
            {label}
        </label>
    );
};


const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; actions?: React.ReactNode; }> = ({ title, children, defaultOpen = false, actions }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="w-full border-b border-[var(--color-border)] last:border-b-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3 text-left text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-panel-light)] transition-colors">
                <div className="flex items-center gap-2">
                    <ChevronDownIcon className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                    <span>{title}</span>
                </div>
                {actions && <div onClick={e => e.stopPropagation()}>{actions}</div>}
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden bg-black/20">
                    {children}
                </div>
            </div>
        </div>
    );
};

const SceneGraphNode: React.FC<{ object: SceneObject; allObjects: SceneObject[]; level: number; }> = ({ object, allObjects, level }) => {
    const { selectedObjectIds, setSelectedObjectIds, addToSelection, toggleObjectProperty } = useStore();
    const isSelected = selectedObjectIds.includes(object.id);
    const children = allObjects.filter(child => child.parentId === object.id);

    return (
        <div className={`relative ${object.isVisible ? '' : 'opacity-50'}`}>
            {level > 0 && <div className="absolute top-0 bottom-0 left-2 w-px bg-[var(--color-border)]" style={{ marginLeft: `${(level - 1) * 1.25}rem` }} />}
            <div
                onClick={(e) => {
                  e.shiftKey ? addToSelection(object.id) : setSelectedObjectIds([object.id]);
                }}
                className={`flex items-center pr-2 py-1.5 cursor-pointer text-sm rounded-md transition-colors ${isSelected ? 'bg-[var(--color-accent)] text-white font-medium' : 'hover:bg-[var(--color-panel-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                style={{ paddingLeft: `${0.5 + level * 1.25}rem` }}
              >
                {getIcon(object.type)}
                <span className="flex-1 truncate">{object.name}</span>
                <div className="flex items-center gap-2 ml-2">
                    <button onClick={e => { e.stopPropagation(); toggleObjectProperty(object.id, 'isLocked'); }} title={object.isLocked ? 'Unlock' : 'Lock'} className="p-1 rounded-full hover:bg-white/10">
                        {object.isLocked ? <LockIcon className="w-3.5 h-3.5 text-orange-400" /> : <UnlockIcon className="w-3.5 h-3.5 text-gray-500 hover:text-white" />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggleObjectProperty(object.id, 'isVisible'); }} title={object.isVisible ? 'Hide' : 'Show'} className="p-1 rounded-full hover:bg-white/10">
                        {object.isVisible ? <EyeOpenIcon className="w-3.5 h-3.5 text-gray-400 hover:text-white" /> : <EyeClosedIcon className="w-3.5 h-3.5 text-gray-600 hover:text-white" />}
                    </button>
                </div>
            </div>
            {children.length > 0 && (
                <div>
                    {children.map(child => <SceneGraphNode key={child.id} object={child} allObjects={allObjects} level={level + 1} />)}
                </div>
            )}
        </div>
    );
};


const Inspector: React.FC = () => {
  const {
    objects, selectedObjectIds, updateObjects, removeSelectedObjects,
    updateObject, measurements, clearAllMeasurements
  } = useStore();

  const [materials, setMaterials] = useState<MaterialPreset[]>(defaultMaterials);
  
  const selectedObjects = useMemo(() => selectedObjectIds.map(id => objects[id]).filter(Boolean), [objects, selectedObjectIds]);
  const allObjects = useMemo(() => Object.values(objects), [objects]);
  const rootObjects = useMemo(() => allObjects.filter(o => !o.parentId), [allObjects]);
  
  const hasSelection = selectedObjects.length > 0;
  const singleSelection = selectedObjects.length === 1 ? selectedObjects[0] : null;

  const getCommonValue = useCallback(<T,>(prop: keyof SceneObject): T | 'Mixed' => {
      if (!hasSelection) return null as T;
      const firstValue = selectedObjects[0][prop];
      for (let i = 1; i < selectedObjects.length; i++) {
        if (JSON.stringify(selectedObjects[i][prop]) !== JSON.stringify(firstValue)) return 'Mixed';
      }
      return firstValue as T;
  }, [selectedObjects, hasSelection]);
  
  const getVectorCommonValue = useCallback((prop: 'position' | 'scale' | 'rotation'): [string, string, string] => {
    if (!hasSelection) return ['0', '0', '0'];

    const isRotation = prop === 'rotation';
    const precision = isRotation ? 1 : 2;
    const epsilon = Math.pow(10, -precision - 1);

    const firstValues = selectedObjects[0][prop];
    const isMixed = [false, false, false];

    for (let i = 1; i < selectedObjects.length; i++) {
      const currentValues = selectedObjects[i][prop];
      for (let j = 0; j < 3; j++) {
        if (!isMixed[j] && Math.abs(currentValues[j] - firstValues[j]) > epsilon) {
          isMixed[j] = true;
        }
      }
      if (isMixed[0] && isMixed[1] && isMixed[2]) break; // Early exit
    }
    
    const format = (val: number) => (isRotation ? val * (180 / Math.PI) : val).toFixed(precision);

    return [
      isMixed[0] ? 'Mixed' : format(firstValues[0]),
      isMixed[1] ? 'Mixed' : format(firstValues[1]),
      isMixed[2] ? 'Mixed' : format(firstValues[2]),
    ];
  }, [hasSelection, selectedObjects]);

  const handleUpdate = (props: Partial<SceneObject>) => {
    if (selectedObjectIds.length > 0) {
      updateObjects(selectedObjectIds.map(id => ({ id, newProps: props })));
    }
  };

  const handleApplyMaterial = (material: MaterialPreset) => {
    if (!hasSelection) return;
    const { name, icon, ...materialProps } = material;
    handleUpdate(materialProps);
    toast.info(`Applied "${name}" material`);
  };

  const handleSaveMaterial = () => {
    if (!singleSelection) return;
    const name = window.prompt("Enter a name for the new material:");
    if (name && name.trim() !== '') {
      const newMaterial: MaterialPreset = {
        name,
        color: singleSelection.color,
        metalness: singleSelection.metalness,
        roughness: singleSelection.roughness,
        opacity: singleSelection.opacity,
        transparent: singleSelection.transparent,
        emissiveColor: singleSelection.emissiveColor,
        emissiveIntensity: singleSelection.emissiveIntensity,
      };
      setMaterials(prev => [...prev, newMaterial]);
      toast.success(`Saved material "${name}"`);
    }
  };

  const renderShapeProperties = () => {
    if (!singleSelection) return null;

    switch(singleSelection.type) {
        case 'text':
            return (
                <CollapsibleSection title="Text Properties" defaultOpen>
                    <div className="space-y-4 p-3">
                        <div>
                            <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 block">Content</label>
                            <input
                                type="text"
                                value={singleSelection.text || ''}
                                onChange={e => updateObject(singleSelection.id, { text: e.target.value })}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition"
                            />
                        </div>
                        <SliderInput label="Depth" value={singleSelection.extrusionDepth ?? 0.2} onChange={v => updateObject(singleSelection.id, { extrusionDepth: v })} min={0.01} max={2} step={0.01} />
                    </div>
                </CollapsibleSection>
            );
        case 'star':
            return (
                <CollapsibleSection title="Star Properties" defaultOpen>
                    <div className="space-y-4 p-3">
                        <SliderInput label="Points" value={singleSelection.starConfig?.points ?? 5} onChange={v => updateObject(singleSelection.id, { starConfig: { ...singleSelection.starConfig!, points: v } })} min={3} max={20} step={1} />
                        <SliderInput label="Inner Radius" value={singleSelection.starConfig?.innerRadius ?? 0.4} onChange={v => updateObject(singleSelection.id, { starConfig: { ...singleSelection.starConfig!, innerRadius: v } })} min={0.1} max={2} step={0.05} />
                        <SliderInput label="Outer Radius" value={singleSelection.starConfig?.outerRadius ?? 1} onChange={v => updateObject(singleSelection.id, { starConfig: { ...singleSelection.starConfig!, outerRadius: v } })} min={0.1} max={2} step={0.05} />
                        <SliderInput label="Depth" value={singleSelection.extrusionDepth ?? 0.2} onChange={v => updateObject(singleSelection.id, { extrusionDepth: v })} min={0.01} max={2} step={0.01} />
                    </div>
                </CollapsibleSection>
            );
        case 'svg':
        case 'heart':
             return (
                <CollapsibleSection title="Shape Properties" defaultOpen>
                    <div className="space-y-4 p-3">
                        <SliderInput label="Depth" value={singleSelection.extrusionDepth ?? 0.2} onChange={v => updateObject(singleSelection.id, { extrusionDepth: v })} min={0.01} max={2} step={0.01} />
                    </div>
                </CollapsibleSection>
            );
        default:
            return null;
    }
  };


  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <CollapsibleSection 
          title="Scene Collection" defaultOpen 
          actions={
            <button onClick={removeSelectedObjects} title="Delete Selected" className="p-1 text-gray-400 hover:text-red-400 disabled:text-gray-700 disabled:hover:text-gray-700" disabled={!hasSelection}>
                <TrashIcon className="w-4 h-4"/>
            </button>
          }
        >
          <div className="p-2">
            {rootObjects.map(obj => <SceneGraphNode key={obj.id} object={obj} allObjects={allObjects} level={0} />)}
            {allObjects.length === 0 && <p className="text-xs text-[var(--color-text-secondary)] text-center px-2 py-4">Scene is empty. Add an object from the toolbar.</p>}
          </div>
        </CollapsibleSection>

        {hasSelection && (
          <CollapsibleSection title="Object Properties" defaultOpen>
            <div className="space-y-4 p-3">
              <input 
                  type="text"
                  value={singleSelection ? singleSelection.name : 'Multiple Selected'}
                  onChange={e => singleSelection && updateObject(singleSelection.id, { name: e.target.value })}
                  disabled={!singleSelection}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition disabled:bg-[#333] disabled:text-gray-500"
              />
            </div>
          </CollapsibleSection>
        )}

        {renderShapeProperties()}
        
        <CollapsibleSection title="Transform" defaultOpen>
          {hasSelection ? (
            <div className="space-y-4 p-3">
              <Vector3Input label="Position" value={getVectorCommonValue('position')} onChange={(v) => handleUpdate({ position: v })} />
              <Vector3Input label="Rotation (°)" value={getVectorCommonValue('rotation')} onChange={(v) => handleUpdate({ rotation: v.map(d => d * (Math.PI / 180)) as [number, number, number]})}/>
              <Vector3Input label="Scale" value={getVectorCommonValue('scale')} onChange={(v) => handleUpdate({ scale: v })} />
            </div>
          ) : ( <p className="text-xs text-[var(--color-text-secondary)] text-center p-3">Select an object to inspect properties.</p> )}
        </CollapsibleSection>
        
        <CollapsibleSection title="Material" defaultOpen>
             {hasSelection ? (
                <div className="space-y-4 p-3">
                  <div>
                    <label htmlFor="color" className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 block">Color</label>
                    <div className="relative h-8">
                      <div 
                        className="absolute inset-0 border border-[var(--color-border)] rounded-md pointer-events-none flex items-center px-2 justify-between"
                        style={{ backgroundColor: getCommonValue<string>('color') !== 'Mixed' ? getCommonValue<string>('color') : 'var(--color-panel-light)' }}
                      >
                        <span className="text-sm font-mono drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">{getCommonValue<string>('color') === 'Mixed' ? 'Mixed' : getCommonValue<string>('color')}</span>
                      </div>
                      <input 
                        id="color" type="color"
                        value={getCommonValue<string>('color') === 'Mixed' ? '#ffffff' : getCommonValue<string>('color')}
                        onChange={(e) => handleUpdate({color: e.target.value})}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <SliderInput label="Metalness" value={getCommonValue<number>('metalness')} onChange={v => handleUpdate({ metalness: v })} />
                  <SliderInput label="Roughness" value={getCommonValue<number>('roughness')} onChange={v => handleUpdate({ roughness: v })} />
                  <div className="h-px bg-[var(--color-border)] !my-2"></div>
                  <SliderInput label="Opacity" value={getCommonValue<number>('opacity')} onChange={v => handleUpdate({ opacity: v })} />
                  <div className="flex items-center justify-between pt-1">
                      <CheckboxInput label="Transparent" checked={getCommonValue<boolean>('transparent')} onChange={v => handleUpdate({ transparent: v })} />
                      <CheckboxInput label="Wireframe" checked={getCommonValue<boolean>('wireframe')} onChange={v => handleUpdate({ wireframe: v })} />
                  </div>
                  <div className="h-px bg-[var(--color-border)] !my-2"></div>
                   <div>
                    <label htmlFor="emissiveColor" className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 block">Emissive</label>
                    <div className="relative h-8">
                      <div 
                        className="absolute inset-0 border border-[var(--color-border)] rounded-md pointer-events-none flex items-center px-2 justify-between"
                        style={{ backgroundColor: getCommonValue<string>('emissiveColor') !== 'Mixed' ? getCommonValue<string>('emissiveColor') : 'var(--color-panel-light)' }}
                      >
                        <span className="text-sm font-mono drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">{getCommonValue<string>('emissiveColor') === 'Mixed' ? 'Mixed' : getCommonValue<string>('emissiveColor')}</span>
                      </div>
                      <input 
                        id="emissiveColor" type="color"
                        value={getCommonValue<string>('emissiveColor') === 'Mixed' ? '#000000' : getCommonValue<string>('emissiveColor')}
                        onChange={(e) => handleUpdate({emissiveColor: e.target.value})}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <SliderInput label="Emissive Intensity" value={getCommonValue<number>('emissiveIntensity')} onChange={v => handleUpdate({ emissiveIntensity: v })} min={0} max={5} step={0.05} />
                </div>
             ) : ( <p className="text-xs text-[var(--color-text-secondary)] text-center p-3">Select an object to inspect materials.</p> )}
        </CollapsibleSection>

        <CollapsibleSection title="Material Library" defaultOpen>
          <div className="grid grid-cols-5 gap-2.5 p-3">
              {materials.map(mat => {
                  const IconComponent = mat.icon ? materialIcons[mat.icon] : null;

                  if (IconComponent) {
                    return (
                      <button
                        key={mat.name}
                        title={mat.name}
                        onClick={() => handleApplyMaterial(mat)}
                        className="w-9 h-9 rounded-md flex items-center justify-center border-2 border-[var(--color-border-light)] hover:border-[var(--color-accent)] focus:border-[var(--color-accent)] focus:outline-none transition-all duration-150 transform hover:scale-110 active:scale-100 bg-[var(--color-panel)]"
                        style={{ color: mat.color }}
                      >
                        <IconComponent className="w-7 h-7" />
                      </button>
                    );
                  }
                  
                  // Fallback for custom materials
                  return (
                      <button
                          key={mat.name}
                          title={mat.name}
                          onClick={() => handleApplyMaterial(mat)}
                          className="w-9 h-9 rounded-full border-2 border-[var(--color-border-light)] hover:border-[var(--color-accent)] focus:border-[var(--color-accent)] focus:outline-none transition-all duration-150 transform hover:scale-110 shadow-inner"
                          style={{ 
                              backgroundColor: mat.color,
                              boxShadow: `inset 0 0 ${mat.roughness * 5}px rgba(0,0,0,0.5), inset 0 0 ${mat.metalness * 3}px rgba(255,255,255,0.3)`
                          }}
                      />
                  );
              })}
          </div>
          {hasSelection && (
            <div className="px-3 pb-3 mt-2 border-t border-[var(--color-border)] pt-3">
              <button
                onClick={handleSaveMaterial}
                disabled={!singleSelection}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-md bg-[var(--color-panel-light)] hover:bg-[var(--color-accent)] disabled:text-[var(--color-text-disabled)] disabled:hover:bg-[var(--color-panel-light)] disabled:cursor-not-allowed transition-colors"
              >
                <PlusCircleIcon className="w-4 h-4" />
                Save Current Material
              </button>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Measurements">
          <div className="p-3">
            {measurements.length > 0 ? (
                <div className="space-y-3">
                    <ul className="space-y-1 text-xs text-[var(--color-text-secondary)]">
                        {measurements.map(m => {
                            const dist = new THREE.Vector3(...m.start).distanceTo(new THREE.Vector3(...m.end));
                            return <li key={m.id} className="flex justify-between">
                                <span>Line <span className="font-mono">{m.id.substring(0, 4)}</span></span>
                                <span className="font-mono text-[var(--color-text-primary)]">{dist.toFixed(3)} units</span>
                            </li>;
                        })}
                    </ul>
                     <button
                        onClick={() => {
                            clearAllMeasurements();
                            toast.info("Measurements cleared");
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-md bg-[var(--color-panel-light)] hover:bg-red-500/80 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Clear All
                      </button>
                </div>
            ) : (
                <p className="text-xs text-[var(--color-text-secondary)] text-center">Activate the measure tool (M) to measure distances in the scene.</p>
            )}
           </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default Inspector;