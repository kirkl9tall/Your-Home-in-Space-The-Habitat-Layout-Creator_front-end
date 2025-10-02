import React, { useRef, useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { AppLogoIcon, SaveIcon, OpenIcon, ImportIcon, ExportIcon, UndoIcon, RedoIcon, CheckIcon, TrashIcon, DuplicateIcon, GridIcon } from './icons';
import { toast } from './Toast';
import JSZip from 'jszip';

const DropdownMenu: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className={`px-3 py-1 rounded-md transition-colors text-sm ${isOpen ? 'bg-[var(--color-panel-light)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-panel-light)] hover:text-[var(--color-text-primary)]'}`}>
        {label}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-60 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)] z-50 py-1.5 animate-fade-in-scale origin-top-left">
          {children}
        </div>
      )}
    </div>
  );
};

const MenuItem: React.FC<{ onClick?: () => void; children: React.ReactNode; shortcut?: string; disabled?: boolean }> = ({ onClick, children, shortcut, disabled }) => (
  <button onClick={onClick} disabled={disabled} className="w-full text-left flex justify-between items-center px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] rounded-md disabled:text-[var(--color-text-disabled)] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors">
    <div className="flex items-center gap-3">{children}</div>
    {shortcut && <span className="text-xs text-[var(--color-text-secondary)]">{shortcut}</span>}
  </button>
);

const SettingsMenuItem: React.FC<{ onClick?: () => void; children: React.ReactNode; isActive?: boolean }> = ({ onClick, children, isActive }) => (
    <button onClick={onClick} className="w-full text-left flex items-center px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] rounded-md transition-colors">
      <div className="w-6 h-4 flex items-center justify-start">
        {isActive && <CheckIcon className="w-3.5 h-3.5" />}
      </div>
      {children}
    </button>
);

const MenuNumericInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}> = ({ label, value, onChange, step = 1 }) => (
  <div className="flex justify-between items-center px-3 py-1.5 text-sm">
    <span className="text-[var(--color-text-primary)]">{label}</span>
    <input
      type="number"
      value={value}
      step={step}
      onChange={(e) => {
        const num = parseFloat(e.target.value);
        if (!isNaN(num)) onChange(num);
      }}
      onClick={(e) => e.stopPropagation()} // Prevent menu from closing
      className="w-20 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-md px-2 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition"
    />
  </div>
);

const MenuSeparator = () => <div className="h-px bg-[var(--color-border)] my-1 mx-2"></div>;

const Header: React.FC = () => {
  const { 
    addImportedObject, undo, redo, duplicateSelectedObjects, removeSelectedObjects, 
    history, historyIndex, saveScene, loadScene, setLoading, selectedObjectIds, 
    setExportRequest, renderQuality, setRenderQuality,
    isGridVisible, gridConfig, toggleGridVisibility, setGridConfig
  } = useStore();
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const loadSceneInputRef = useRef<HTMLInputElement>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasSelection = selectedObjectIds.length > 0;

  const handleImportClick = () => importFileInputRef.current?.click();
  const handleLoadClick = () => loadSceneInputRef.current?.click();
  const handleExport = () => {
    setExportRequest('glb');
    toast.info("Exporting model...");
  }

  const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setLoading(true, 'Importing Model...');

    try {
        if (file.name.endsWith('.zip')) {
            const zip = await JSZip.loadAsync(file);
            const fileMap: Record<string, string> = {};
            let entryPoint: string | null = null;
            const promises = Object.keys(zip.files).map(async (filename) => {
                const zipFile = zip.files[filename];
                if (!zipFile.dir) {
                    const fileData = await zipFile.async('blob');
                    fileMap[zipFile.name] = URL.createObjectURL(fileData);
                    if (zipFile.name.endsWith('.gltf') || zipFile.name.endsWith('.glb')) {
                        entryPoint = zipFile.name;
                    }
                }
            });
            await Promise.all(promises);
            if (entryPoint) addImportedObject({ modelUrl: fileMap[entryPoint], fileMap });
        } else {
            addImportedObject({ modelUrl: URL.createObjectURL(file) });
        }
        toast.success("Model imported successfully");
    } catch (e) {
        console.error("Import failed:", e);
        toast.error("Failed to import model");
    } finally {
        setLoading(false);
    }
  };

  const handleSceneLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    loadScene(file);
    event.target.value = '';
    toast.success("Scene loaded successfully");
  };

  const handleSave = () => {
    saveScene();
    toast.success("Scene saved");
  };

  return (
    <header className="flex items-center h-10 px-2 bg-[var(--color-header)] border-b border-[var(--color-border)] shadow-sm z-20 flex-shrink-0">
      <div className="flex items-center gap-2">
        <AppLogoIcon className="w-6 h-6 text-[var(--color-accent)] ml-2" />
        <h1 className="text-md font-semibold text-[var(--color-text-primary)] tracking-wide mr-4">CAD Labo Pro</h1>
      </div>
      
      <nav className="flex items-center gap-1 text-sm text-[var(--color-text-primary)]">
        <DropdownMenu label="File">
          <MenuItem onClick={handleSave}><SaveIcon className="w-4 h-4" />Save Scene</MenuItem>
          <MenuItem onClick={handleLoadClick}><OpenIcon className="w-4 h-4" />Load Scene...</MenuItem>
          <MenuSeparator />
          <MenuItem onClick={handleImportClick}><ImportIcon className="w-4 h-4" />Import Model...</MenuItem>
          <MenuItem onClick={handleExport}><ExportIcon className="w-4 h-4" />Export as GLB</MenuItem>
        </DropdownMenu>
        <DropdownMenu label="Edit">
          <MenuItem onClick={undo} shortcut="Ctrl+Z" disabled={!canUndo}><UndoIcon className="w-4 h-4"/>Undo</MenuItem>
          <MenuItem onClick={redo} shortcut="Ctrl+Y" disabled={!canRedo}><RedoIcon className="w-4 h-4"/>Redo</MenuItem>
          <MenuSeparator />
          <MenuItem onClick={duplicateSelectedObjects} shortcut="Ctrl+D" disabled={!hasSelection}><DuplicateIcon className="w-4 h-4"/>Duplicate</MenuItem>
          <MenuItem onClick={removeSelectedObjects} shortcut="Delete" disabled={!hasSelection}><TrashIcon className="w-4 h-4"/>Delete</MenuItem>
        </DropdownMenu>
        <DropdownMenu label="View">
            <SettingsMenuItem onClick={toggleGridVisibility} isActive={isGridVisible}><GridIcon className="w-4 h-4 mr-1.5" />Show Grid</SettingsMenuItem>
            <MenuSeparator />
            <div className="px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Shadow Quality</div>
            <SettingsMenuItem onClick={() => setRenderQuality({ shadowMapSize: 512 })} isActive={renderQuality.shadowMapSize === 512}>Low (512px)</SettingsMenuItem>
            <SettingsMenuItem onClick={() => setRenderQuality({ shadowMapSize: 1024 })} isActive={renderQuality.shadowMapSize === 1024}>Medium (1024px)</SettingsMenuItem>
            <SettingsMenuItem onClick={() => setRenderQuality({ shadowMapSize: 2048 })} isActive={renderQuality.shadowMapSize === 2048}>High (2048px)</SettingsMenuItem>
            <MenuSeparator />
            <div className="px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Antialiasing (DPR)</div>
            <SettingsMenuItem onClick={() => setRenderQuality({ dpr: 1 })} isActive={renderQuality.dpr === 1}>Low (1x)</SettingsMenuItem>
            <SettingsMenuItem onClick={() => setRenderQuality({ dpr: 1.5 })} isActive={renderQuality.dpr === 1.5}>Medium (1.5x)</SettingsMenuItem>
            <SettingsMenuItem onClick={() => setRenderQuality({ dpr: 2 })} isActive={renderQuality.dpr === 2}>High (2x)</SettingsMenuItem>
            <MenuSeparator />
            <div className="px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Grid Settings</div>
            <MenuNumericInput 
                label="Cell Size"
                value={gridConfig.cellSize}
                onChange={(v) => setGridConfig({ cellSize: v })}
                step={0.1}
            />
            <MenuNumericInput 
                label="Section Size"
                value={gridConfig.sectionSize}
                onChange={(v) => setGridConfig({ sectionSize: v })}
                step={1}
            />
            <MenuNumericInput 
                label="Fade Distance"
                value={gridConfig.fadeDistance}
                onChange={(v) => setGridConfig({ fadeDistance: v })}
                step={10}
            />
        </DropdownMenu>
      </nav>
      
      <div className="flex-1" />
      
       <input type="file" ref={importFileInputRef} onChange={handleImportFileChange} accept=".glb,.gltf,.zip" className="hidden" />
       <input type="file" ref={loadSceneInputRef} onChange={handleSceneLoad} accept=".cadlabo" className="hidden" />
    </header>
  );
};

export default Header;