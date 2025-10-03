// src/components/MarsTerrainConfig.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Satellite, Eye, EyeOff, Settings, Info } from 'lucide-react';

interface MarsTerrainConfigProps {
  onDatasetChange?: (dataset: string) => void;
  onSkyToggle?: (enabled: boolean) => void;
  onGlobalToggle?: (enabled: boolean) => void;
  currentDataset?: string;
  skyEnabled?: boolean;
  globalEnabled?: boolean;
  cesiumApiKeyAvailable?: boolean;
}

export default function MarsTerrainConfig({ 
  onDatasetChange,
  onSkyToggle,
  onGlobalToggle,
  currentDataset = 'dingoGap',
  skyEnabled = true,
  globalEnabled = false,
  cesiumApiKeyAvailable = false
}: MarsTerrainConfigProps) {
  const [isOpen, setIsOpen] = useState(false);

  const datasets = [
    {
      id: 'dingoGap',
      name: 'MSL Dingo Gap',
      mission: 'Curiosity Rover',
      description: 'High-resolution terrain from Mars Science Laboratory mission',
      hasSky: true,
      resolution: 'Ultra High'
    },
    {
      id: 'm20Drive',
      name: 'Mars 2020 Drive',
      mission: 'Perseverance Rover',
      description: 'Latest terrain data from Mars 2020 Perseverance mission',
      hasSky: false,
      resolution: 'High'
    }
  ];

  const currentDatasetInfo = datasets.find(d => d.id === currentDataset);

  if (!isOpen) {
    return (
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-red-900/80 hover:bg-red-800 text-white border border-red-700 backdrop-blur-sm"
          size="sm"
        >
          <Globe className="w-4 h-4 mr-2" />
          Mars Terrain
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-50 bg-gray-900/95 border border-red-700 rounded-lg p-4 backdrop-blur-sm shadow-2xl min-w-[320px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-red-400" />
          <h3 className="text-white font-semibold">Mars Terrain System</h3>
        </div>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          ×
        </Button>
      </div>

      {/* Current Dataset Info */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="text-sm text-gray-300 mb-1">Current Dataset</div>
        <div className="text-white font-medium">{currentDatasetInfo?.name}</div>
        <div className="text-xs text-gray-400">{currentDatasetInfo?.mission}</div>
        <div className="text-xs text-gray-500 mt-1">{currentDatasetInfo?.description}</div>
      </div>

      {/* Dataset Selection */}
      <div className="space-y-2 mb-4">
        <div className="text-sm font-medium text-gray-300">Available Datasets</div>
        {datasets.map((dataset) => (
          <button
            key={dataset.id}
            onClick={() => onDatasetChange?.(dataset.id)}
            className={`w-full p-3 rounded-lg border text-left transition-all ${
              currentDataset === dataset.id
                ? 'bg-red-900/30 border-red-600 text-white'
                : 'bg-gray-800/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium">{dataset.name}</div>
              <div className="text-xs px-2 py-1 bg-gray-700 rounded">{dataset.resolution}</div>
            </div>
            <div className="text-xs text-gray-400">{dataset.mission}</div>
            <div className="text-xs text-gray-500 mt-1">{dataset.description}</div>
            {dataset.hasSky && (
              <div className="text-xs text-blue-400 mt-1">✨ Includes 360° sky dome</div>
            )}
          </button>
        ))}
      </div>

      {/* Mars Atmosphere Toggle */}
      {currentDatasetInfo?.hasSky && (
        <div className="mb-4">
          <button
            onClick={() => onSkyToggle?.(!skyEnabled)}
            className={`w-full p-3 rounded-lg border flex items-center justify-between transition-all ${
              skyEnabled
                ? 'bg-blue-900/30 border-blue-600 text-white'
                : 'bg-gray-800/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {skyEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Mars Atmosphere (360° Sky)</span>
            </div>
            <div className="text-xs px-2 py-1 bg-gray-700 rounded">
              {skyEnabled ? 'ON' : 'OFF'}
            </div>
          </button>
        </div>
      )}

      {/* Global Context Toggle */}
      <div className="mb-4">
        <button
          onClick={() => onGlobalToggle?.(!globalEnabled)}
          disabled={!cesiumApiKeyAvailable}
          className={`w-full p-3 rounded-lg border flex items-center justify-between transition-all ${
            !cesiumApiKeyAvailable
              ? 'bg-gray-800/20 border-gray-700 text-gray-500 cursor-not-allowed'
              : globalEnabled
              ? 'bg-green-900/30 border-green-600 text-white'
              : 'bg-gray-800/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4" />
            <span>Global Mars Context</span>
          </div>
          <div className="text-xs px-2 py-1 bg-gray-700 rounded">
            {cesiumApiKeyAvailable 
              ? (globalEnabled ? 'ON' : 'OFF')
              : 'API KEY REQUIRED'
            }
          </div>
        </button>
        {!cesiumApiKeyAvailable && (
          <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs text-yellow-200">
            <Info className="w-3 h-3 inline mr-1" />
            Add VITE_CESIUM_ION_KEY to .env.local for global Mars terrain
          </div>
        )}
      </div>

      {/* Performance Info */}
      <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
        <div className="flex items-center gap-1 mb-1">
          <Settings className="w-3 h-3" />
          Performance Impact
        </div>
        <div>• Sky dome: Minimal impact</div>
        <div>• Global context: Moderate impact</div>
        <div>• Multiple datasets: High impact</div>
      </div>
    </div>
  );
}