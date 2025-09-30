import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, FileText, Play, RotateCcw, Copy, CheckCircle, Box, Users, Calendar, MapPin, Ruler, RefreshCw, Info } from "lucide-react";
import AnalysisResults, { AnalyzerResult } from "@/ui/AnalysisResults";
import { postAnalyzeRaw } from "@/api/analyzer";

const SAMPLE_PAYLOAD = `{
  "scenario": {
    "crew_size": 4,
    "mission_duration_days": 365,
    "destination": "MARS_SURFACE",
    "fairing": {
      "name": "Falcon 9",
      "inner_diameter_m": 5.2,
      "inner_height_m": 13.1,
      "shape": "CONE"
    }
  },
  "habitat": {
    "shape": "CYLINDER",
    "levels": 2,
    "dimensions": {
      "diameter_m": 6.5,
      "height_m": 12
    },
    "pressurized_volume_m3": 400,
    "net_habitable_volume_m3": 300
  },
  "modules": [
    {
      "id": "crew-sleep-6",
      "type": "CREW_SLEEP",
      "level": 0,
      "position": [0, 0],
      "size": { "w_m": 2, "l_m": 2.2, "h_m": 2.1 },
      "rotation_deg": 0,
      "crew_capacity": 1,
      "equipment": []
    },
    {
      "id": "food-prep-1",
      "type": "FOOD_PREP",
      "level": 0,
      "position": [6, 7],
      "size": { "w_m": 3, "l_m": 3, "h_m": 2.2 },
      "rotation_deg": 0,
      "equipment": []
    },
    {
      "id": "food-prep-1",
      "type": "FOOD_PREP",
      "level": 0,
      "position": [6, 7],
      "size": { "w_m": 3, "l_m": 3, "h_m": 2.2 },
      "rotation_deg": 0,
      "equipment": []
    },
    {
      "id": "food-prep-1",
      "type": "FOOD_PREP",
      "level": 0,
      "position": [6, 7],
      "size": { "w_m": 3, "l_m": 3, "h_m": 2.2 },
      "rotation_deg": 0,
      "equipment": []
    },
    {
      "id": "hygiene-1",
      "type": "HYGIENE",
      "level": 0,
      "position": [2, -2],
      "size": { "w_m": 2, "l_m": 2, "h_m": 2.2 },
      "rotation_deg": 0,
      "equipment": []
    },
    {
      "id": "exercise-1",
      "type": "EXERCISE",
      "level": 0,
      "position": [-1, -3.5],
      "size": { "w_m": 3, "l_m": 4, "h_m": 2.5 },
      "rotation_deg": 0,
      "equipment": []
    },
    {
      "id": "medical-2",
      "type": "MEDICAL",
      "level": 0,
      "position": [-6.5, -5],
      "size": { "w_m": 2.5, "l_m": 2.5, "h_m": 2.3 },
      "rotation_deg": 0,
      "equipment": []
    },
    {
      "id": "maintenance-3",
      "type": "MAINTENANCE",
      "level": 0,
      "position": [4.5, -3.5],
      "size": { "w_m": 2.5, "l_m": 2.5, "h_m": 2.3 },
      "rotation_deg": 0,
      "equipment": []
    },
    {
      "id": "maintenance-1",
      "type": "MAINTENANCE",
      "level": 0,
      "position": [-9, -2.5],
      "size": { "w_m": 2.5, "l_m": 2.5, "h_m": 2.3 },
      "rotation_deg": 0,
      "equipment": []
    }
  ],
  "version": "1.0.0"
}`;

// Helper functions to load design data from localStorage
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const STORAGE_KEYS = {
  SCENARIO: 'nasa-habitat-scenario',
  OBJECTS: 'nasa-habitat-objects',
};

// Generate NASA layout from current design data
const generateNASALayoutFromStorage = () => {
  const scenario = loadFromStorage(STORAGE_KEYS.SCENARIO, {
    crew_size: 4,
    mission_duration_days: 365,
    destination: "MARS_SURFACE",
    fairing: { name: "Falcon 9", inner_diameter_m: 5.2, inner_height_m: 13.1, shape: "CONE" }
  });
  
  const objects = loadFromStorage(STORAGE_KEYS.OBJECTS, []);
  
  // Convert objects to NASA modules format
  const modules = objects.map((obj: any, index: number) => ({
    id: obj.id || `module-${index}`,
    type: obj.type || "CREW_SLEEP",
    level: 0,
    position: [obj.position?.x || 0, obj.position?.z || 0],
    size: {
      w_m: obj.size?.width || 2,
      l_m: obj.size?.depth || 2,
      h_m: obj.size?.height || 2.1
    },
    rotation_deg: obj.rotation?.y ? (obj.rotation.y * 180 / Math.PI) : 0,
    crew_capacity: obj.type === "CREW_SLEEP" ? 1 : undefined,
    equipment: []
  }));

  return {
    scenario: {
      crew_size: scenario.crew_size || 4,
      mission_duration_days: scenario.mission_duration_days || 365,
      destination: scenario.destination || "MARS_SURFACE",
      fairing: {
        name: scenario.fairing?.name || "Falcon 9",
        inner_diameter_m: scenario.fairing?.inner_diameter_m || 5.2,
        inner_height_m: scenario.fairing?.inner_height_m || 13.1,
        shape: scenario.fairing?.shape || "CONE"
      }
    },
    habitat: {
      shape: "CYLINDER",
      levels: 1,
      dimensions: {
        diameter_m: 6.5,
        height_m: 12
      },
      pressurized_volume_m3: 400,
      net_habitable_volume_m3: 300
    },
    modules,
    version: "1.0.0"
  };
};

export default function AnalysisPage() {
  const [editor, setEditor] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentDesign, setCurrentDesign] = useState<any>(null);

  // Load current design on component mount
  useEffect(() => {
    const loadCurrentDesign = () => {
      const layout = generateNASALayoutFromStorage();
      setCurrentDesign(layout);
      setEditor(JSON.stringify(layout, null, 2));
    };
    
    loadCurrentDesign();
    
    // Listen for storage changes to update when design is modified
    const handleStorageChange = () => loadCurrentDesign();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadCurrentDesignData = () => {
    const layout = generateNASALayoutFromStorage();
    setCurrentDesign(layout);
    setEditor(JSON.stringify(layout, null, 2));
  };

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      // Try to pass through raw editor text; server accepts JSON body
      const res = await postAnalyzeRaw(editor);
      setResult(res);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(editor);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">NASA Habitat Analysis</h1>
          <p className="text-blue-200">Advanced mission validation and optimization system</p>
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="outline" className="text-green-400 border-green-400">
              API Connected
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              Real-time Analysis
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* No Design Message */}
          {!currentDesign?.modules?.length && (
            <Card className="glass-morphism border-yellow-500/30 shadow-2xl">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Box className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-yellow-200 mb-2">No Habitat Design Found</h3>
                  <p className="text-yellow-300 mb-4">Create a habitat design first to analyze it with NASA standards.</p>
                  <Button 
                    onClick={() => window.location.href = '/design'}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Box className="w-4 h-4 mr-2" />
                    Go to Design Area
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Design Overview */}
          {currentDesign?.modules?.length > 0 && (
            <Card className="glass-morphism border-purple-500/30 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-purple-200 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Current Habitat Design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center">
                    <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-purple-300">{currentDesign.scenario?.crew_size || 0}</div>
                    <div className="text-xs text-purple-400">Crew Size</div>
                  </div>
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center">
                    <Box className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-purple-300">{currentDesign.modules?.length || 0}</div>
                    <div className="text-xs text-purple-400">Modules</div>
                  </div>
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center">
                    <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-purple-300">{currentDesign.scenario?.mission_duration_days || 0}</div>
                    <div className="text-xs text-purple-400">Mission Days</div>
                  </div>
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center">
                    <MapPin className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-purple-300">{currentDesign.scenario?.destination || "Unknown"}</div>
                    <div className="text-xs text-purple-400">Destination</div>
                  </div>
                </div>
                
                {currentDesign.modules?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-purple-200 mb-2">Module Breakdown:</h4>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(
                        currentDesign.modules.reduce((acc: any, module: any) => {
                          acc[module.type] = (acc[module.type] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([type, count]) => (
                        <Badge key={type} variant="outline" className="text-purple-300 border-purple-500/30">
                          {type}: {count as number}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Control Panel */}
          <Card className="glass-morphism border-blue-500/30 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-200 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Mission Analysis Control
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadCurrentDesignData}
                    className="border-green-500/30 text-green-200 hover:bg-green-500/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Load Current Design
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowEditor(!showEditor)}
                    className="border-blue-500/30 text-blue-200 hover:bg-blue-500/10"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {showEditor ? 'Hide' : 'Show'} Payload
                    {showEditor ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                  </Button>
                  <Button 
                    onClick={onSubmit} 
                    disabled={busy}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {busy ? "Analyzing..." : "Run Analysis"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showEditor && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-blue-200">JSON Payload Editor</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={copyPayload}
                        className="border-blue-500/30 text-blue-200 hover:bg-blue-500/10"
                      >
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditor(SAMPLE_PAYLOAD)} 
                        disabled={busy}
                        className="border-blue-500/30 text-blue-200 hover:bg-blue-500/10"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                  <textarea
                    className="w-full h-64 font-mono text-xs p-4 bg-gray-900/50 border border-blue-500/30 rounded-lg resize-none text-green-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editor}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditor(e.target.value)}
                    placeholder="Paste or edit the analyzer JSON payload here"
                  />
                </div>
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="glass-morphism border-green-500/30 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-green-200 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Analysis Results
                </CardTitle>
                {result && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={copyResult}
                    className="border-green-500/30 text-green-200 hover:bg-green-500/10"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy Results
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AnalysisResults data={result} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}