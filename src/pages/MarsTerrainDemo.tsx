import React from 'react';
import { MarsDesignArea } from '../components/MarsDesignArea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Globe, Rocket, Zap, Radio, Home, Leaf, Plane } from 'lucide-react';

export const MarsTerrainDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-amber-900">
      {/* Hero Section */}
      <div className="relative z-10 bg-black bg-opacity-50 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Globe className="w-12 h-12 text-red-400 mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Mars Terrain Designer
              </h1>
            </div>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Design realistic Mars habitats on authentic Martian terrain using NASA's 3D tile data. 
              Place habitat modules, solar panels, and infrastructure with precision on the Red Planet's surface.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { icon: Home, name: 'Habitat Modules', color: 'bg-blue-600' },
              { icon: Zap, name: 'Solar Arrays', color: 'bg-green-600' },
              { icon: Radio, name: 'Comm Systems', color: 'bg-red-600' },
              { icon: Rocket, name: 'Landing Pads', color: 'bg-gray-600' },
              { icon: Leaf, name: 'Greenhouses', color: 'bg-emerald-600' },
              { icon: Plane, name: 'Rover Garages', color: 'bg-orange-600' }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="bg-gray-800 border-gray-600 text-center">
                  <CardContent className="p-4">
                    <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-300">{item.name}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="bg-red-900 text-red-100">
              NASA Mars Data
            </Badge>
            <Badge variant="secondary" className="bg-orange-900 text-orange-100">
              Real Martian Terrain
            </Badge>
            <Badge variant="secondary" className="bg-blue-900 text-blue-100">
              3D Tile Streaming
            </Badge>
            <Badge variant="secondary" className="bg-green-900 text-green-100">
              Interactive Design
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Design Area */}
      <div className="h-screen">
        <MarsDesignArea />
      </div>
    </div>
  );
};