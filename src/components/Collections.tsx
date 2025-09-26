// src/components/Collections.tsx
/**
 * Design Collections Manager
 * Save, load, and manage habitat designs with database storage
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Save,
  Folder,
  Download,
  Upload,
  Trash2,
  Search,
  Star,
  Clock,
  Tag,
  Share2,
  Copy,
  Eye,
  Edit,
  Plus,
  Grid,
  List,
  Filter
} from 'lucide-react';
import {
  listDesigns,
  saveDesign,
  updateDesign,
  deleteDesign,
  searchDesigns,
  getDesignsByTag,
  exportDesign,
  importDesign,
  SavedDesign
} from '@/lib/database';
import { Layout } from '@/lib/schemas';

interface CollectionsProps {
  currentLayout?: Layout;
  onLoadDesign?: (design: SavedDesign) => void;
  onSaveSuccess?: (designId: string) => void;
}

export default function Collections({ currentLayout, onLoadDesign, onSaveSuccess }: CollectionsProps) {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [filteredDesigns, setFilteredDesigns] = useState<SavedDesign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    newTag: ''
  });

  // Load designs on component mount
  useEffect(() => {
    loadDesigns();
  }, []);

  // Filter designs based on search and tags
  useEffect(() => {
    let filtered = designs;
    
    if (searchQuery) {
      filtered = filtered.filter(design =>
        design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(design => design.tags.includes(selectedTag));
    }
    
    setFilteredDesigns(filtered);
  }, [designs, searchQuery, selectedTag]);

  const loadDesigns = async () => {
    setIsLoading(true);
    try {
      const loadedDesigns = await listDesigns();
      setDesigns(loadedDesigns);
    } catch (error) {
      console.error('Failed to load designs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get all unique tags
  const getAllTags = () => {
    const tagSet = new Set<string>();
    designs.forEach(design => {
      design.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  // Handle save design
  const handleSaveDesign = async () => {
    if (!currentLayout || !saveForm.name.trim()) {
      alert('Please enter a design name');
      return;
    }

    setIsSaving(true);
    try {
      const designId = await saveDesign({
        name: saveForm.name,
        description: saveForm.description,
        layout: currentLayout,
        tags: saveForm.tags,
      });

      await loadDesigns();
      setShowSaveDialog(false);
      setSaveForm({ name: '', description: '', tags: [], newTag: '' });
      
      if (onSaveSuccess) {
        onSaveSuccess(designId);
      }
      
      alert('Design saved successfully!');
    } catch (error) {
      console.error('Failed to save design:', error);
      alert('Failed to save design. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete design
  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) {
      return;
    }

    try {
      await deleteDesign(designId);
      await loadDesigns();
    } catch (error) {
      console.error('Failed to delete design:', error);
      alert('Failed to delete design. Please try again.');
    }
  };

  // Handle export design
  const handleExportDesign = async (designId: string) => {
    try {
      const designJSON = await exportDesign(designId);
      const design = designs.find(d => d.id === designId);
      
      const blob = new Blob([designJSON], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${design?.name || 'habitat-design'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export design:', error);
      alert('Failed to export design. Please try again.');
    }
  };

  // Handle import design
  const handleImportDesign = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const designJSON = e.target?.result as string;
        await importDesign(designJSON);
        await loadDesigns();
        alert('Design imported successfully!');
      } catch (error) {
        console.error('Failed to import design:', error);
        alert('Failed to import design. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // Add tag to save form
  const addTag = () => {
    if (saveForm.newTag.trim() && !saveForm.tags.includes(saveForm.newTag.trim())) {
      setSaveForm(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  // Remove tag from save form
  const removeTag = (tagToRemove: string) => {
    setSaveForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/20 border-b border-purple-500/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                Design Collections
              </h1>
              <p className="text-sm text-gray-300">Manage your saved habitat designs</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Import */}
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportDesign}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button className="bg-green-600 hover:bg-green-700">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
            
            {/* Save Current */}
            {currentLayout && (
              <Button 
                onClick={() => setShowSaveDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Current
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-black/10 border-b border-purple-500/20 p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          
          {/* Tag Filter */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white"
          >
            <option value="">All Tags</option>
            {getAllTags().map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          
          {/* View Mode */}
          <div className="flex items-center gap-1 bg-gray-800/30 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600' : 'hover:bg-gray-700/50'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600' : 'hover:bg-gray-700/50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Design List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading designs...</div>
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400 mb-2">No designs found</div>
              <p className="text-sm text-gray-500">
                {searchQuery || selectedTag ? 'Try adjusting your filters' : 'Create your first habitat design'}
              </p>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                className={`bg-gray-800/30 border border-gray-700/30 rounded-lg p-4 hover:bg-gray-700/30 transition-all ${
                  viewMode === 'list' ? 'flex items-center justify-between' : ''
                }`}
              >
                <div className={viewMode === 'list' ? 'flex-1' : ''}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-white truncate">{design.name}</h3>
                    {viewMode === 'grid' && (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => onLoadDesign?.(design)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {design.description && (
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">{design.description}</p>
                  )}
                  
                  {/* Tags */}
                  {design.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {design.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-purple-600/30 text-purple-200 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(design.updatedAt)}
                    </div>
                    <div>{design.layout.modules.length} modules</div>
                  </div>
                  
                  {viewMode === 'grid' && (
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => onLoadDesign?.(design)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Load Design
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleExportDesign(design.id)}>
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteDesign(design.id)}
                        className="hover:bg-red-600/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {viewMode === 'list' && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" onClick={() => onLoadDesign?.(design)}>
                      Load
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExportDesign(design.id)}>
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteDesign(design.id)}
                      className="hover:bg-red-600/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Save Design</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Design Name</label>
                <input
                  type="text"
                  value={saveForm.name}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  placeholder="Enter design name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={saveForm.description}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white resize-none"
                  rows={3}
                  placeholder="Describe your design"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={saveForm.newTag}
                    onChange={(e) => setSaveForm(prev => ({ ...prev, newTag: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
                    placeholder="Add tag"
                  />
                  <Button size="sm" onClick={addTag}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {saveForm.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-purple-600/30 text-purple-200 text-xs rounded-full flex items-center gap-1"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-300">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveDesign} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Design'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}