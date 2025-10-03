// src/components/LunarTerrainConfig.tsx
import React from 'react';
import { Moon, Earth, Rocket, Mountain } from 'lucide-react';

interface LunarTerrainConfigProps {
  isVisible: boolean;
  currentDataset: string;
  onDatasetChange: (dataset: string) => void;
  showLunarSky: boolean;
  onLunarSkyToggle: (show: boolean) => void;
  showEarth: boolean;
  onEarthToggle: (show: boolean) => void;
  terrainOpacity: number;
  onTerrainOpacityChange: (opacity: number) => void;
}

export default function LunarTerrainConfig({ 
  isVisible, 
  currentDataset, 
  onDatasetChange,
  showLunarSky,
  onLunarSkyToggle,
  showEarth,
  onEarthToggle,
  terrainOpacity,
  onTerrainOpacityChange
}: LunarTerrainConfigProps) {
  if (!isVisible) return null;

  const lunarDatasets = [
    {
      id: 'apollo11',
      name: 'Apollo 11 - Sea of Tranquility',
      description: 'Historic first moon landing site',
      icon: <Rocket className="w-4 h-4" />
    },
    {
      id: 'apollo15',
      name: 'Apollo 15 - Hadley-Apennine',
      description: 'Mountainous lunar terrain',
      icon: <Mountain className="w-4 h-4" />
    },
    {
      id: 'apollo17',
      name: 'Apollo 17 - Taurus-Littrow',
      description: 'Valley with geological diversity',
      icon: <Mountain className="w-4 h-4" />
    },
    {
      id: 'southPole',
      name: 'Lunar South Pole - Artemis Target',
      description: 'Future Artemis landing region',
      icon: <Rocket className="w-4 h-4" />
    },
    {
      id: 'shackleton',
      name: 'Shackleton Crater',
      description: 'Permanently shadowed crater rim',
      icon: <Mountain className="w-4 h-4" />
    },
    {
      id: 'oceanProcellarum',
      name: 'Oceanus Procellarum',
      description: 'Largest lunar mare',
      icon: <Moon className="w-4 h-4" />
    }
  ];

  return (
    <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 min-w-[320px] max-w-[400px] z-10">
      <div className="flex items-center gap-2 mb-4">
        <Moon className="w-5 h-5 text-gray-300" />
        <h3 className="text-lg font-semibold text-white">Lunar Terrain Control</h3>
      </div>

      {/* Dataset Selection */}
      <div className="space-y-3 mb-4">
        <label className="block text-sm font-medium text-gray-300">
          Landing Site / Region
        </label>
        <select
          value={currentDataset}
          onChange={(e) => onDatasetChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {lunarDatasets.map((dataset) => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.name}
            </option>
          ))}
        </select>
        
        {/* Dataset Description */}
        <p className="text-xs text-gray-400">
          {lunarDatasets.find(d => d.id === currentDataset)?.description}
        </p>
      </div>

      {/* Terrain Opacity */}
      <div className="space-y-2 mb-4">
        <label className="block text-sm font-medium text-gray-300">
          Terrain Visibility: {Math.round(terrainOpacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={terrainOpacity}
          onChange={(e) => onTerrainOpacityChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Environment Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Lunar Sky Dome</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showLunarSky}
              onChange={(e) => onLunarSkyToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Earth className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">Earth in Sky</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showEarth}
              onChange={(e) => onEarthToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Data Source Info */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Data: NASA LROC, LOLA, Apollo Mission Archives
        </p>
      </div>
    </div>
  );
}
