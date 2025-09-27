import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Lightbulb,
  Palette,
  MousePointer2,
  Keyboard,
  Eye,
  TrendingUp,
  Users,
  HelpCircle
} from 'lucide-react'

import { QuickActionsToolbar } from '@/components/ui/QuickActionsToolbar'
import { UserGuidanceSystem } from '@/components/ui/UserGuidanceSystem'
import { SmartStatusSystem } from '@/components/ui/SmartStatusSystem'
import { Tooltip } from '@/components/ui/tooltip'
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut'

export const Route = createFileRoute('/ui-showcase')({
  component: UIShowcaseComponent
})

function UIShowcaseComponent() {
  const [activeDemo, setActiveDemo] = useState<'overview' | 'components'>('overview');
  const [showTutorial, setShowTutorial] = useState(false);

  // Mock metrics for status system demo
  const mockMetrics = {
    totalModules: 8,
    crewCapacity: 6,
    totalVolume: 156.3,
    powerConsumption: 12.4,
    efficiency: 87,
    safetyScore: 94,
    completeness: 73
  };

  const mockWarnings = [
    "Life Support module required for crew safety",
    "Consider adding backup power systems"
  ];

  const mockSuggestions = [
    "Add Medical Bay for crews larger than 4",
    "Optimize module placement for better flow",
    "Consider adding Recreation module for crew wellness"
  ];

  if (activeDemo === 'components') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setActiveDemo('overview')}
              className="mb-4"
            >
              ← Back to Overview
            </Button>
            <h1 className="text-3xl font-bold mb-2">UI Components Interactive Demo</h1>
            <p className="text-muted-foreground">Experience all the enhanced UI/UX components in action</p>
          </div>

          <Tabs defaultValue="actions" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="actions">Quick Actions</TabsTrigger>
              <TabsTrigger value="guidance">User Guidance</TabsTrigger>
              <TabsTrigger value="status">Smart Status</TabsTrigger>
              <TabsTrigger value="tooltips">Tooltips & Shortcuts</TabsTrigger>
              <TabsTrigger value="interactive">Interactive Elements</TabsTrigger>
            </TabsList>

            {/* Quick Actions Demo */}
            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions Toolbar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <QuickActionsToolbar
                        onUndo={() => alert('Undo action!')}
                        onRedo={() => alert('Redo action!')}
                        onCopy={() => alert('Copy action!')}
                        onPaste={() => alert('Paste action!')}
                        onToggleGrid={() => alert('Toggle grid!')}
                        onToggleMeasure={() => alert('Toggle measure mode!')}
                        onHelp={() => alert('Show help!')}
                        canUndo={true}
                        canRedo={false}
                        canPaste={true}
                      />
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-medium">Features:</h3>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Keyboard shortcuts with visual indicators</li>
                        <li>• Context-aware button states</li>
                        <li>• Categorized actions for better organization</li>
                        <li>• Tooltips with shortcut information</li>
                        <li>• Responsive design for mobile/desktop</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Guidance Demo */}
            <TabsContent value="guidance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Interactive Tutorial System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Button 
                        onClick={() => setShowTutorial(true)}
                        className="w-full"
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Launch Tutorial Demo
                      </Button>
                      
                      <div className="space-y-3">
                        <h3 className="font-medium">Tutorial Features:</h3>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• 7-step interactive walkthrough</li>
                          <li>• Visual highlighting of interface elements</li>
                          <li>• Auto-play and manual navigation</li>
                          <li>• Context-sensitive tips and actions</li>
                          <li>• Progress tracking and completion</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-medium mb-3">Tutorial Steps:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Welcome & Overview</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Module Palette Introduction</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>3D Placement Controls</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Multi-Level Design</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Analytics Dashboard</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {showTutorial && (
                    <UserGuidanceSystem
                      isFirstVisit={true}
                      onComplete={() => {
                        setShowTutorial(false);
                        alert('Tutorial completed! 🎉');
                      }}
                      onSkip={() => {
                        setShowTutorial(false);
                        alert('Tutorial skipped');
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Smart Status Demo */}
            <TabsContent value="status" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Smart Status System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="max-w-md">
                      <SmartStatusSystem
                        metrics={mockMetrics}
                        warnings={mockWarnings}
                        suggestions={mockSuggestions}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Smart Features:</h3>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span><strong>Real-time Metrics:</strong> Live calculation of design completeness, efficiency, and safety scores</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span><strong>Intelligent Warnings:</strong> Context-aware alerts for design issues</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span><strong>AI Suggestions:</strong> Smart recommendations for optimization</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span><strong>Progress Tracking:</strong> Visual progress bars and completion indicators</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span><strong>NASA Standards:</strong> Compliance checking against space habitat requirements</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tooltips & Shortcuts Demo */}
            <TabsContent value="tooltips" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="w-5 h-5" />
                    Enhanced Tooltips & Keyboard Shortcuts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Interactive Tooltips</h3>
                      <div className="flex flex-wrap gap-4">
                        <Tooltip content="This is a helpful tooltip with detailed information">
                          <Button variant="outline">Hover for Basic Tooltip</Button>
                        </Tooltip>
                        
                        <Tooltip 
                          content={
                            <div>
                              <div className="font-medium">Advanced Tooltip</div>
                              <div className="text-sm mt-1">With custom content and formatting</div>
                              <KeyboardShortcut keys={['Ctrl', 'Shift', 'A']} className="mt-2" />
                            </div>
                          }
                        >
                          <Button variant="outline">Hover for Advanced Tooltip</Button>
                        </Tooltip>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Keyboard Shortcuts</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Undo</span>
                          <KeyboardShortcut keys={['Ctrl', 'Z']} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Redo</span>
                          <KeyboardShortcut keys={['Ctrl', 'Shift', 'Z']} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Toggle Grid</span>
                          <KeyboardShortcut keys={['G']} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Measure Mode</span>
                          <KeyboardShortcut keys={['M']} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Copy</span>
                          <KeyboardShortcut keys={['Ctrl', 'C']} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Paste</span>
                          <KeyboardShortcut keys={['Ctrl', 'V']} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Help</span>
                          <KeyboardShortcut keys={['F1']} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Settings</span>
                          <KeyboardShortcut keys={['Ctrl', ',']} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interactive Elements Demo */}
            <TabsContent value="interactive" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Interactive UI Elements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Visual Feedback</h3>
                      <div className="space-y-2">
                        <Button className="w-full hover:scale-105 transition-transform">
                          Scale on Hover
                        </Button>
                        <Button variant="outline" className="w-full hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white transition-all">
                          Gradient Hover
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">Status Badges</h3>
                      <div className="space-y-2">
                        <Badge className="bg-green-100 text-green-800">✅ Excellent</Badge>
                        <Badge className="bg-blue-100 text-blue-800">ℹ️ Good</Badge>
                        <Badge className="bg-yellow-100 text-yellow-800">⚠️ Fair</Badge>
                        <Badge className="bg-red-100 text-red-800">❌ Poor</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">Micro-interactions</h3>
                      <div className="space-y-2">
                        <div className="p-3 border rounded hover:shadow-md transition-shadow cursor-pointer">
                          Hover for shadow
                        </div>
                        <div className="p-3 border rounded hover:border-blue-300 transition-colors cursor-pointer">
                          Hover for color change
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Enhanced UI/UX Experience
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the comprehensive UI/UX improvements that make habitat design intuitive, 
            efficient, and enjoyable for users of all skill levels.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer2 className="w-5 h-5 text-blue-600" />
                Quick Actions Toolbar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Comprehensive toolbar with keyboard shortcuts, tooltips, and context-aware actions 
                for efficient workflow management.
              </p>
              <div className="space-y-2">
                <Badge variant="secondary" className="mr-2">Keyboard Shortcuts</Badge>
                <Badge variant="secondary" className="mr-2">Smart Tooltips</Badge>
                <Badge variant="secondary" className="mr-2">Context Awareness</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-green-600" />
                Interactive Tutorial System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Step-by-step guided tutorials with visual highlighting, auto-play functionality, 
                and contextual tips for new users.
              </p>
              <div className="space-y-2">
                <Badge variant="secondary" className="mr-2">7-Step Walkthrough</Badge>
                <Badge variant="secondary" className="mr-2">Visual Highlighting</Badge>
                <Badge variant="secondary" className="mr-2">Auto-Play Mode</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Smart Status System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Real-time design analysis with intelligent warnings, AI-powered suggestions, 
                and NASA compliance checking.
              </p>
              <div className="space-y-2">
                <Badge variant="secondary" className="mr-2">Real-Time Metrics</Badge>
                <Badge variant="secondary" className="mr-2">AI Suggestions</Badge>
                <Badge variant="secondary" className="mr-2">NASA Standards</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-orange-600" />
                Enhanced Tooltips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Rich tooltips with custom content, keyboard shortcut displays, and smart positioning 
                for better user guidance.
              </p>
              <div className="space-y-2">
                <Badge variant="secondary" className="mr-2">Custom Content</Badge>
                <Badge variant="secondary" className="mr-2">Shortcut Display</Badge>
                <Badge variant="secondary" className="mr-2">Smart Positioning</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-teal-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-teal-600" />
                Visual Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Smooth animations, hover effects, and micro-interactions that provide immediate 
                visual feedback for all user actions.
              </p>
              <div className="space-y-2">
                <Badge variant="secondary" className="mr-2">Smooth Animations</Badge>
                <Badge variant="secondary" className="mr-2">Hover Effects</Badge>
                <Badge variant="secondary" className="mr-2">Micro-interactions</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-600" />
                Accessibility & Usability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Designed for users of all skill levels with clear navigation, helpful guidance, 
                and intuitive interface patterns.
              </p>
              <div className="space-y-2">
                <Badge variant="secondary" className="mr-2">Beginner Friendly</Badge>
                <Badge variant="secondary" className="mr-2">Clear Navigation</Badge>
                <Badge variant="secondary" className="mr-2">Intuitive Design</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="text-center">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-4">Experience the Enhanced Interface</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Explore all the UI/UX improvements in our interactive component showcase. 
              See how these enhancements make habitat design more intuitive and efficient.
            </p>
            <Button 
              size="lg" 
              onClick={() => setActiveDemo('components')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Launch Interactive Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}