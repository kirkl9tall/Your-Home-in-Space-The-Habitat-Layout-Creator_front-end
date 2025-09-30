// src/ui/CollectionSelector.tsx
/**
 * Collection Selector for Analysis
 * Allows users to select saved designs from collections and run analysis on them
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderOpen,
  Play,
  Search,
  Clock,
  Users,
  Calendar,
  MapPin,
  ChevronRight,
  Rocket,
  Settings,
  Filter,
  RefreshCw
} from 'lucide-react';
import { listDesigns, SavedDesign, initDatabase } from '@/lib/database';
import { Layout } from '@/lib/schemas';

interface CollectionSelectorProps {
  onDesignSelected: (payload: string, designData: any) => void;
}

export default function CollectionSelector({ onDesignSelected }: CollectionSelectorProps) {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [filteredDesigns, setFilteredDesigns] = useState<SavedDesign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);

  // Load designs when component mounts
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
      // Ensure database is initialized before loading designs
      await initDatabase();
      const loadedDesigns = await listDesigns();
      console.log('Loaded designs:', loadedDesigns); // Debug log
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

  // Convert design to analysis payload and design data
  const convertToAnalysisPayload = (layout: Layout): { payload: string; designData: any } => {
    // Create a basic analysis payload structure from the saved design
    const payloadData = {
      scenario: {
        crew_size: 4, // Default values - user can modify in editor
        mission_duration_days: 365,
        destination: "MARS_SURFACE",
        fairing: {
          name: "Falcon 9",
          inner_diameter_m: 5.2,
          inner_height_m: 13.1,
          shape: "CONE"
        }
      },
      habitat: {
        shape: layout.habitat?.shape || "CYLINDER",
        levels: layout.habitat?.levels || 1,
        dimensions: layout.habitat?.dimensions || {
          diameter_m: 6.5,
          height_m: 12
        },
        pressurized_volume_m3: layout.habitat?.pressurized_volume_m3 || 400,
        net_habitable_volume_m3: layout.habitat?.net_habitable_volume_m3 || 300
      },
      modules: layout.modules.map(module => ({
        id: module.id,
        type: module.type,
        level: module.level || 0,
        position: module.position || [0, 0],
        size: module.size || { w_m: 2, l_m: 2, h_m: 2.2 },
        rotation_deg: module.rotation_deg || 0,
        crew_capacity: module.crew_capacity || 0,
        equipment: module.equipment || []
      }))
    };

    return {
      payload: JSON.stringify(payloadData, null, 2),
      designData: payloadData
    };
  };

  // Handle design selection
  const handleSelectDesign = (design: SavedDesign) => {
    setSelectedDesign(design);
    const { payload, designData } = convertToAnalysisPayload(design.layout);
    onDesignSelected(payload, designData);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <Card className="glass-morphism border-[var(--nasa-blue)]/30 shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[var(--nasa-accent)]" />
              Collection Analysis
            </CardTitle>
            <p className="text-[var(--brand-2)]">Select a saved design from your collections to analyze</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDesigns}
            disabled={isLoading}
            className="border-[var(--nasa-blue)]/40 text-white hover:bg-[var(--nasa-blue)]/20"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/20 border border-[var(--nasa-blue)]/30 rounded-lg text-white placeholder-gray-400 focus:border-[var(--nasa-accent)]/50 focus:ring-1 focus:ring-[var(--nasa-accent)]/50"
            />
          </div>
          
          {getAllTags().length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 bg-black/20 border border-[var(--nasa-blue)]/30 rounded-lg text-white focus:border-[var(--nasa-accent)]/50"
            >
              <option value="">All Categories</option>
              {getAllTags().map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>

        {/* Design List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-400">Loading collections...</div>
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {designs.length === 0 ? 'No Saved Designs' : 'No Matching Designs'}
            </h3>
            <p className="text-gray-400 mb-4">
              {designs.length === 0 
                ? 'Create and save designs first to analyze them here.' 
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {designs.length === 0 && (
              <Button 
                onClick={() => window.location.href = '/design'}
                className="bg-[var(--nasa-accent)] hover:bg-[var(--nasa-accent)]/80 text-white"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Create Design
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                className={`group relative bg-black/20 border rounded-lg p-4 cursor-pointer transition-all hover:bg-black/30 hover:border-[var(--nasa-accent)]/50 ${
                  selectedDesign?.id === design.id 
                    ? 'border-[var(--nasa-accent)] bg-[var(--nasa-accent)]/10' 
                    : 'border-[var(--nasa-blue)]/30'
                }`}
                onClick={() => handleSelectDesign(design)}
              >
                {/* Design Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white truncate">{design.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(design.updatedAt)}
                    </div>
                  </div>
                  {selectedDesign?.id === design.id && (
                    <div className="w-2 h-2 bg-[var(--nasa-accent)] rounded-full"></div>
                  )}
                </div>

                {/* Design Info */}
                <div className="space-y-2 mb-3">
                  {design.description && (
                    <p className="text-sm text-gray-300 line-clamp-2">{design.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {design.layout.modules.length} modules
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {design.layout.habitat?.levels || 1} level{(design.layout.habitat?.levels || 1) !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {design.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {design.tags.slice(0, 3).map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs px-2 py-0 bg-[var(--nasa-blue)]/20 border-[var(--nasa-blue)]/30 text-[var(--nasa-blue)]"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {design.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs px-2 py-0 text-gray-400">
                        +{design.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Select Action */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Click to select for analysis
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[var(--nasa-accent)] transition-colors" />
                </div>

                {/* Selected Indicator */}
                {selectedDesign?.id === design.id && (
                  <div className="absolute inset-0 border-2 border-[var(--nasa-accent)] rounded-lg pointer-events-none">
                    <div className="absolute -top-2 -right-2 bg-[var(--nasa-accent)] text-white text-xs px-2 py-1 rounded-full">
                      Selected
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Selected Design Info */}
        {selectedDesign && (
          <div className="mt-4 p-4 bg-[var(--nasa-accent)]/10 border border-[var(--nasa-accent)]/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Selected: {selectedDesign.name}</h4>
                <p className="text-sm text-[var(--brand-2)]">
                  Analysis payload has been loaded into the editor
                </p>
              </div>
              <Badge className="bg-[var(--nasa-accent)] text-white">
                Ready for Analysis
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}