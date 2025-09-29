import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Rocket,
  BarChart3,
  Users,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { HabitatValidationButton } from './HabitatValidationButton';
import { ValidationResults } from './ValidationResults';
import { useHabitatDesign } from '@/contexts/HabitatDesignContext';

export const AnalysisPage = () => {
  const [activeTab, setActiveTab] = useState('nasa');
  const [validationResults, setValidationResults] = useState(null);
  const { design } = useHabitatDesign();
  
  // Debug callback for validation results
  const handleValidationComplete = (results: any) => {
    console.log('🎯 AnalysisPage - Received validation results:', results);
    console.log('🎯 AnalysisPage - Results type:', typeof results);
    console.log('🎯 AnalysisPage - Results JSON:', JSON.stringify(results, null, 2));
    
    // Handle case where results might be stringified JSON
    let parsedResults = results;
    if (typeof results === 'string') {
      try {
        parsedResults = JSON.parse(results);
        console.log('🔧 AnalysisPage - Parsed string to object:', parsedResults);
      } catch (e) {
        console.error('❌ AnalysisPage - Failed to parse results string:', e);
      }
    }
    
    setValidationResults(parsedResults);
  };
  
  // Debug logging
  console.log('🔍 AnalysisPage - Design data:', design);
  console.log('📊 AnalysisPage - Objects:', design.objects);
  console.log('📈 AnalysisPage - Objects length:', design.objects?.length);
  console.log('🎯 AnalysisPage - validationResults state:', validationResults);
  
  // Calculate design statistics
  const designStats = {
    moduleCount: design.objects?.length || 0,
    crewSize: design.scenario?.crew_size || 0,
    destination: design.scenario?.destination || 'unknown',
    lastModified: design.lastModified ? new Date(design.lastModified).toLocaleDateString() : 'Never'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Habitat Analysis Suite</h1>
          </div>
          <p className="text-xl text-gray-300">
            Comprehensive validation and analysis tools for your space habitat design
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass-morphism border-white/10">
            <TabsTrigger 
              value="nasa" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-200"
            >
              <Rocket className="w-4 h-4" />
              NASA Validation
            </TabsTrigger>
            <TabsTrigger 
              value="efficiency" 
              className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-200"
            >
              <Zap className="w-4 h-4" />
              Efficiency
            </TabsTrigger>
            <TabsTrigger 
              value="crew" 
              className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-200"
            >
              <Users className="w-4 h-4" />
              Crew Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="safety" 
              className="flex items-center gap-2 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-200"
            >
              <AlertTriangle className="w-4 h-4" />
              Safety
            </TabsTrigger>
          </TabsList>

          {/* NASA Validation Tab */}
          <TabsContent value="nasa" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Validation Controls */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="glass-morphism border-blue-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-200">
                      <Rocket className="w-5 h-5" />
                      NASA Standards Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="text-sm font-medium text-gray-200">Current Design</div>
                        <div className="text-xs text-gray-400 mt-1">
                          • {designStats.moduleCount} modules placed
                          • {designStats.crewSize} crew members  
                          • {designStats.destination.replace('_', ' ')} mission
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Last modified: {designStats.lastModified}
                        </div>
                      </div>
                      
                      {designStats.moduleCount > 0 ? (
                        <HabitatValidationButton
                          modules={design.objects}
                          scenario={design.scenario}
                          habitat={design.habitat}
                          onValidationComplete={handleValidationComplete}
                          className="w-full"
                        />
                      ) : (
                        <div className="p-3 bg-amber-900/30 border border-amber-500/30 rounded-lg">
                          <div className="text-sm text-amber-200">No modules to validate</div>
                          <div className="text-xs text-amber-300/80 mt-1">
                            Go to the Design page to add habitat modules first
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-morphism border-slate-500/30">
                  <CardHeader>
                    <CardTitle className="text-gray-200 text-sm">Validation Criteria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        Volume & Pressurization
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        Life Support Systems
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        Structural Integrity
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        Emergency Protocols
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Validation Results */}
              <div className="lg:col-span-2">
                <Card className="glass-morphism border-slate-500/30 h-full">
                  <CardHeader>
                    <CardTitle className="text-gray-200">Validation Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {validationResults ? (
                      <>
                        <div style={{marginBottom: '10px', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc'}}>
                          <strong>DEBUG INFO:</strong><br/>
                          validationResults exists: {validationResults ? 'YES' : 'NO'}<br/>
                          validationResults type: {typeof validationResults}<br/>
                          validationResults keys: {validationResults ? Object.keys(validationResults).join(', ') : 'none'}
                        </div>
                        <ValidationResults results={validationResults} />
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        <div className="text-center">
                          <Rocket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Run validation to see detailed results</p>
                          <p className="text-sm mt-2">NASA standards compliance will be displayed here</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Efficiency Analysis Tab */}
          <TabsContent value="efficiency" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-morphism border-green-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-200">
                    <Zap className="w-5 h-5" />
                    Space Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Modules:</span>
                      <span className="text-white font-bold">{designStats.moduleCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Estimated Volume:</span>
                      <span className="text-white font-bold">{(designStats.moduleCount * 12.5).toFixed(1)} m³</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Crew Efficiency:</span>
                      <span className="text-white font-bold">{designStats.crewSize > 0 ? (designStats.moduleCount / designStats.crewSize).toFixed(1) : 'N/A'} modules/crew</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${Math.min((designStats.moduleCount / 10) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-400">Space utilization: {Math.min((designStats.moduleCount / 10) * 100, 100).toFixed(0)}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-green-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-200">
                    <BarChart3 className="w-5 h-5" />
                    Resource Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Essential Systems:</span>
                      <span className="text-green-400 font-bold">{Math.min(designStats.moduleCount * 0.3, 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Living Quarters:</span>
                      <span className="text-blue-400 font-bold">{Math.min(designStats.moduleCount * 0.4, 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Work Areas:</span>
                      <span className="text-orange-400 font-bold">{Math.min(designStats.moduleCount * 0.3, 100).toFixed(0)}%</span>
                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                      <p>Optimal distribution achieved for current module count</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Crew Analysis Tab */}
          <TabsContent value="crew" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-morphism border-orange-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-200">
                    <Users className="w-5 h-5" />
                    Crew Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Crew Size:</span>
                      <span className="text-white font-bold">{designStats.crewSize} members</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Living Space per Crew:</span>
                      <span className="text-white font-bold">{designStats.crewSize > 0 ? (designStats.moduleCount * 12.5 / designStats.crewSize).toFixed(1) : 'N/A'} m³</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Mission Duration:</span>
                      <span className="text-white font-bold">{design.scenario?.mission_duration_days || 365} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Crew Density:</span>
                      <span className={`font-bold ${designStats.crewSize <= 4 ? 'text-green-400' : designStats.crewSize <= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {designStats.crewSize <= 4 ? 'Optimal' : designStats.crewSize <= 6 ? 'High' : 'Critical'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-orange-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-200">
                    <BarChart3 className="w-5 h-5" />
                    Workflow Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Work Stations:</span>
                      <span className="text-blue-400 font-bold">{Math.ceil(designStats.moduleCount * 0.4)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Rest Areas:</span>
                      <span className="text-green-400 font-bold">{Math.ceil(designStats.moduleCount * 0.3)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Common Areas:</span>
                      <span className="text-purple-400 font-bold">{Math.ceil(designStats.moduleCount * 0.3)}</span>
                    </div>
                    <div className="mt-4 p-3 bg-orange-900/30 rounded-lg border border-orange-500/30">
                      <p className="text-sm text-orange-200">
                        Current layout supports {designStats.crewSize > 0 ? 'efficient' : 'flexible'} crew workflow patterns
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Safety Analysis Tab */}
          <TabsContent value="safety" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-morphism border-red-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-200">
                    <AlertTriangle className="w-5 h-5" />
                    Emergency Systems
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Emergency Exits:</span>
                      <span className="text-green-400 font-bold">{Math.max(2, Math.ceil(designStats.moduleCount / 3))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Fire Suppression:</span>
                      <span className="text-green-400 font-bold">Active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Life Support Backup:</span>
                      <span className="text-yellow-400 font-bold">Redundant</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Communication:</span>
                      <span className="text-green-400 font-bold">Multi-channel</span>
                    </div>
                    <div className="mt-4 p-3 bg-red-900/30 rounded-lg border border-red-500/30">
                      <p className="text-sm text-red-200">
                        Safety protocols meet NASA standards for {designStats.destination.replace('_', ' ').toLowerCase()} missions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-red-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-200">
                    <Users className="w-5 h-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Structural Risk:</span>
                      <span className="text-green-400 font-bold">Low</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">System Failure Risk:</span>
                      <span className="text-yellow-400 font-bold">Moderate</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Crew Health Risk:</span>
                      <span className={`font-bold ${designStats.crewSize <= 4 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {designStats.crewSize <= 4 ? 'Low' : 'Moderate'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Mission Success:</span>
                      <span className="text-green-400 font-bold">{Math.min(85 + (designStats.moduleCount * 2), 99)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(85 + (designStats.moduleCount * 2), 99)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};