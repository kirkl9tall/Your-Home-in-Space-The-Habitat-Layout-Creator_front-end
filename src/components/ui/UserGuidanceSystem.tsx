import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  action?: string;
  tip?: string;
  type: 'info' | 'action' | 'success' | 'warning';
}

interface UserGuidanceSystemProps {
  isFirstVisit?: boolean;
  currentStep?: number;
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to NASA Habitat Designer! 🚀',
    description: 'Create and analyze space habitats with professional tools. This quick tour will show you the key features.',
    type: 'info'
  },
  {
    id: 'palette',
    title: 'Module Palette',
    description: 'Browse 16 NASA-standard modules on the left. Click any module to add it to your habitat design.',
    target: '[data-tutorial="module-palette"]',
    action: 'Try clicking on a module type',
    type: 'action'
  },
  {
    id: 'placement',
    title: '3D Placement',
    description: 'Drag modules in the 3D view to position them. Use scroll wheel to zoom and right-click to rotate the view.',
    target: '[data-tutorial="3d-canvas"]',
    action: 'Try dragging a module',
    type: 'action'
  },
  {
    id: 'levels',
    title: 'Multi-Level Design',
    description: 'Create multi-story habitats by selecting different levels. Each level is 2.4m high following NASA standards.',
    target: '[data-tutorial="level-selector"]',
    action: 'Try changing the active level',
    type: 'action'
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    description: 'View real-time habitat analytics including volume utilization, power consumption, and crew efficiency metrics.',
    target: '[data-tutorial="analytics-tab"]',
    action: 'Click the Analytics tab to explore',
    type: 'action'
  },
  {
    id: 'heatmap',
    title: 'Traffic Heat Maps',
    description: 'Analyze crew movement patterns with interactive heat maps. Identify bottlenecks and optimize circulation.',
    target: '[data-tutorial="traffic-tab"]',
    tip: 'Heat maps help optimize crew workflow efficiency',
    type: 'info'
  },
  {
    id: 'complete',
    title: 'You\'re Ready to Design! ✨',
    description: 'You now know the basics. Start creating your space habitat and use the quick actions toolbar for efficiency.',
    type: 'success'
  }
];

export function UserGuidanceSystem({ 
  isFirstVisit = false, 
  currentStep = 0,
  onComplete,
  onSkip,
  className = ""
}: UserGuidanceSystemProps) {
  const [activeStep, setActiveStep] = useState(currentStep);
  const [isVisible, setIsVisible] = useState(isFirstVisit);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightTarget, setHighlightTarget] = useState<string | null>(null);

  const currentTutorialStep = tutorialSteps[activeStep];

  useEffect(() => {
    if (currentTutorialStep?.target) {
      setHighlightTarget(currentTutorialStep.target);
      // Add highlight class to target element
      const element = document.querySelector(currentTutorialStep.target);
      if (element) {
        element.classList.add('tutorial-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return () => {
      // Cleanup highlights
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
    };
  }, [activeStep, currentTutorialStep]);

  const nextStep = () => {
    if (activeStep < tutorialSteps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const completeTutorial = () => {
    setIsVisible(false);
    onComplete?.();
    // Remove all highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  };

  const skipTutorial = () => {
    setIsVisible(false);
    onSkip?.();
    // Remove all highlights  
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  };

  const startAutoPlay = () => {
    setIsPlaying(true);
    const interval = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= tutorialSteps.length - 1) {
          setIsPlaying(false);
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 4000);
  };

  const getStepIcon = (type: TutorialStep['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'action':
        return <Play className="w-5 h-5 text-green-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Lightbulb className="w-4 h-4 mr-2" />
        Tutorial
      </Button>
    );
  }

  return (
    <>
      {/* Overlay for highlighting */}
      {highlightTarget && (
        <div className="fixed inset-0 bg-black/20 z-40 pointer-events-none" />
      )}
      
      {/* Tutorial Card */}
      <Card className={`fixed bottom-4 right-4 w-96 z-50 bg-white shadow-xl border-2 border-blue-200 ${className}`}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getStepIcon(currentTutorialStep.type)}
              <Badge variant="secondary" className="text-xs">
                Step {activeStep + 1} of {tutorialSteps.length}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={skipTutorial}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((activeStep + 1) / tutorialSteps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {currentTutorialStep.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {currentTutorialStep.description}
              </p>
            </div>

            {currentTutorialStep.action && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Try this:
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  {currentTutorialStep.action}
                </p>
              </div>
            )}

            {currentTutorialStep.tip && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Pro Tip:
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {currentTutorialStep.tip}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={prevStep}
                disabled={activeStep === 0}
                className="h-8 px-3"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              
              {!isPlaying ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startAutoPlay}
                  className="h-8 px-3"
                >
                  <Play className="w-3 h-3" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPlaying(false)}
                  className="h-8 px-3"
                >
                  <Pause className="w-3 h-3" />
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveStep(0)}
                className="h-8 px-3"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={skipTutorial}
                className="h-8 px-3 text-gray-500"
              >
                Skip
              </Button>
              
              <Button
                size="sm"
                onClick={nextStep}
                className="h-8 px-4"
              >
                {activeStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutorial highlight styles */}
      <style>{`
        .tutorial-highlight {
          position: relative;
          z-index: 41;
          border: 2px solid #3b82f6 !important;
          border-radius: 8px;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1);
          }
        }
      `}</style>
    </>
  );
}