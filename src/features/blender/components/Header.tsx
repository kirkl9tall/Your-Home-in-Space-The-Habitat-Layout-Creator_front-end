import React, { useRef, useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { CubeIcon, FileIcon, UndoIcon, RedoIcon, ChevronDownIcon, TrashIcon, DuplicateIcon } from './icons';
import JSZip from 'jszip';

// A reusable Dropdown Menu component for the header
const DropdownMenu: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1 rounded hover:bg-white/10 transition-colors"
      >
        {label}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-[#3c3c3c] border border-black/30 rounded-md shadow-2xl z-50 py-1">
          {children}
        </div>
      )}
    </div>
  );
};

// A reusable menu item component
const MenuItem: React.FC<{ onClick: () => void; children: React.ReactNode; shortcut?: string }> = ({ onClick, children, shortcut }) => (
  <button
    onClick={onClick}
    className="w-full text-left flex justify-between items-center px-3 py-1.5 text-sm text-gray-200 hover:bg-cyan-600/50"
  >
    <div className="flex items-center gap-2">{children}</div>
    {shortcut && <span className="text-xs text-gray-400">{shortcut}</span>}
  </button>
);


const Header: React.FC = () => {
  const { addImportedObject, undo, redo, duplicateSelectedObjects, removeSelectedObjects, history, historyIndex } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 2;

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        const fileMap: Record<string, string> = {};
        let entryPoint: string | null = null;
        // Fix: Iterate over Object.keys to ensure zipFile is correctly typed.
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
  };

  return (
    <header className="flex items-center h-10 px-2 bg-[#323233] border-b border-black/30 shadow-sm z-20 flex-shrink-0">
      <div className="flex items-center gap-2">
        <CubeIcon className="w-5 h-5 text-cyan-400 ml-2" />
        <h1 className="text-md font-semibold text-gray-100 tracking-wide mr-2">CAD Labo Pro</h1>
      </div>
      
      <nav className="flex items-center gap-1 text-sm text-gray-200">
        <DropdownMenu label="File">
          <MenuItem onClick={handleImportClick}><FileIcon className="w-4 h-4" />Import...</MenuItem>
        </DropdownMenu>
        <DropdownMenu label="Edit">
          <MenuItem onClick={undo} shortcut="Ctrl+Z"><UndoIcon className="w-4 h-4"/>Undo</MenuItem>
          <MenuItem onClick={redo} shortcut="Ctrl+Y"><RedoIcon className="w-4 h-4"/>Redo</MenuItem>
          <div className="h-px bg-white/10 my-1"></div>
          <MenuItem onClick={duplicateSelectedObjects} shortcut="Ctrl+D"><DuplicateIcon className="w-4 h-4"/>Duplicate</MenuItem>
          <MenuItem onClick={removeSelectedObjects} shortcut="Delete"><TrashIcon className="w-4 h-4"/>Delete</MenuItem>
        </DropdownMenu>
        <DropdownMenu label="Object">
           <MenuItem onClick={() => {}}>Add</MenuItem>
           <MenuItem onClick={() => {}}>Transform</MenuItem>
        </DropdownMenu>
      </nav>
      
      <div className="flex-1 flex justify-center items-center">
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-md">
            <button onClick={undo} disabled={!canUndo} className="p-1 rounded hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent" title="Undo (Ctrl+Z)"><UndoIcon className="w-5 h-5"/></button>
            <button onClick={redo} disabled={!canRedo} className="p-1 rounded hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent" title="Redo (Ctrl+Y)"><RedoIcon className="w-5 h-5"/></button>
        </div>
      </div>
      
      <div className="w-[200px] flex justify-end">
        {/* Placeholder for future elements like user profile or settings */}
      </div>

       <input
          type="file" ref={fileInputRef} onChange={handleFileChange}
          accept=".glb,.gltf,.zip" className="hidden"
        />
    </header>
  );
};

export default Header;
