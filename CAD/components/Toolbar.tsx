import React, { useRef } from 'react';
import useStore from '../store/useStore';
import { ShapeType } from '../types';
import { CubeIcon, SphereIcon, CylinderIcon, TorusIcon, ConeIcon, PlaneIcon, PyramidIcon, CapsuleIcon, GearIcon, ChevronDownIcon, TextIcon, StarIcon, HeartIcon, SvgIcon } from './icons';
import { toast } from './Toast';

const ShapeButton: React.FC<{
  shape: ShapeType;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}> = ({ shape, Icon }) => {
  const { setCreationMode, creationState } = useStore();
  const isActive = creationState.shapeType === shape;

  const handleClick = () => {
    // If it's already active, deactivate it. Otherwise, activate it.
    setCreationMode(isActive ? null : shape);
  };
  
  return (
    <button
      onClick={handleClick}
      title={`Add ${shape.charAt(0).toUpperCase() + shape.slice(1)}`}
      className={`flex flex-col items-center justify-center w-full h-20 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-panel)] focus-visible:ring-[var(--color-accent)] ${
        isActive
          ? 'bg-[var(--color-accent)] text-white shadow-md'
          : 'bg-[var(--color-panel-light)] hover:bg-white/10 text-[var(--color-text-primary)]'
      }`}
    >
      <Icon className="w-8 h-8" />
      <span className="text-xs mt-1.5 capitalize">{shape}</span>
    </button>
  );
};

const ActionButton: React.FC<{
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
}> = ({ label, Icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex flex-col items-center justify-center w-full h-20 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-panel)] focus-visible:ring-[var(--color-accent)] bg-[var(--color-panel-light)] hover:bg-white/10 text-[var(--color-text-primary)]"
    >
      <Icon className="w-8 h-8" />
      <span className="text-xs mt-1.5 capitalize">{label}</span>
    </button>
  );
};


const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    return (
        <div className="w-full">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3 text-left text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-panel-light)] transition-colors">
                <span className="uppercase tracking-wider">{title}</span>
                 <ChevronDownIcon className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
                {children}
            </div>
        </div>
    );
};

const Toolbar: React.FC = () => {
  const { addSvgObject, setLoading } = useStore();
  const svgImportRef = useRef<HTMLInputElement>(null);

  const handleSvgImportClick = () => svgImportRef.current?.click();

  const handleSvgFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    
    if (!file.name.endsWith('.svg')) {
      toast.error("Please select a valid .svg file.");
      return;
    }
    
    setLoading(true, 'Importing SVG...');
    try {
      const svgData = await file.text();
      addSvgObject(svgData, file.name.replace('.svg', ''));
      toast.success("SVG imported successfully");
    } catch (e) {
      console.error("SVG Import failed:", e);
      toast.error("Failed to import SVG file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
        <CollapsibleSection title="Add Primitive">
            <div className="p-3 grid grid-cols-2 gap-2.5">
                <ShapeButton shape="cube" Icon={CubeIcon} />
                <ShapeButton shape="sphere" Icon={SphereIcon} />
                <ShapeButton shape="cylinder" Icon={CylinderIcon} />
                <ShapeButton shape="cone" Icon={ConeIcon} />
                <ShapeButton shape="torus" Icon={TorusIcon} />
                <ShapeButton shape="plane" Icon={PlaneIcon} />
                <ShapeButton shape="capsule" Icon={CapsuleIcon} />
                <ShapeButton shape="pyramid" Icon={PyramidIcon} />
            </div>
        </CollapsibleSection>

        <CollapsibleSection title="Add Advanced">
            <div className="p-3 grid grid-cols-2 gap-2.5">
                <ShapeButton shape="gear" Icon={GearIcon} />
                <ShapeButton shape="text" Icon={TextIcon} />
                <ShapeButton shape="star" Icon={StarIcon} />
                <ShapeButton shape="heart" Icon={HeartIcon} />
                <ActionButton label="Import SVG" Icon={SvgIcon} onClick={handleSvgImportClick} />
            </div>
        </CollapsibleSection>
        
        <input type="file" ref={svgImportRef} onChange={handleSvgFileChange} accept=".svg" className="hidden" />
    </div>
  );
};

export default Toolbar;