import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { KeyboardShortcut, useKeyboardShortcut } from '@/components/ui/keyboard-shortcut';
import { Badge } from '@/components/ui/badge';
import { 
  Undo2, 
  Redo2, 
  Copy, 
  Clipboard, 
  RotateCcw, 
  Move, 
  MousePointer2,
  Grid3x3,
  Ruler,
  Layers3,
  Zap,
  Settings2,
  Info,
  HelpCircle
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string[];
  action: () => void;
  description: string;
  category: 'edit' | 'view' | 'tool' | 'help';
}

interface QuickActionsToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onReset?: () => void;
  onToggleGrid?: () => void;
  onToggleMeasure?: () => void;
  onToggleLayers?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  canPaste?: boolean;
  isGridVisible?: boolean;
  isMeasureMode?: boolean;
  showLayers?: boolean;
}

export function QuickActionsToolbar({
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onReset,
  onToggleGrid,
  onToggleMeasure,
  onToggleLayers,
  onSettings,
  onHelp,
  canUndo = false,
  canRedo = false,
  canPaste = false,
  isGridVisible = true,
  isMeasureMode = false,
  showLayers = true
}: QuickActionsToolbarProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'undo',
      label: 'Undo',
      icon: <Undo2 className="w-4 h-4" />,
      shortcut: ['Ctrl', 'Z'],
      action: onUndo || (() => {}),
      description: 'Undo the last action',
      category: 'edit'
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: <Redo2 className="w-4 h-4" />,
      shortcut: ['Ctrl', 'Shift', 'Z'],
      action: onRedo || (() => {}),
      description: 'Redo the last undone action',
      category: 'edit'
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: <Copy className="w-4 h-4" />,
      shortcut: ['Ctrl', 'C'],
      action: onCopy || (() => {}),
      description: 'Copy selected modules',
      category: 'edit'
    },
    {
      id: 'paste',
      label: 'Paste',
      icon: <Clipboard className="w-4 h-4" />,
      shortcut: ['Ctrl', 'V'],
      action: onPaste || (() => {}),
      description: 'Paste copied modules',
      category: 'edit'
    },
    {
      id: 'reset',
      label: 'Reset View',
      icon: <RotateCcw className="w-4 h-4" />,
      shortcut: ['R'],
      action: onReset || (() => {}),
      description: 'Reset camera to default position',
      category: 'view'
    },
    {
      id: 'grid',
      label: isGridVisible ? 'Hide Grid' : 'Show Grid',
      icon: <Grid3x3 className="w-4 h-4" />,
      shortcut: ['G'],
      action: onToggleGrid || (() => {}),
      description: 'Toggle grid visibility',
      category: 'view'
    },
    {
      id: 'measure',
      label: isMeasureMode ? 'Exit Measure' : 'Measure',
      icon: <Ruler className="w-4 h-4" />,
      shortcut: ['M'],
      action: onToggleMeasure || (() => {}),
      description: 'Toggle measurement mode',
      category: 'tool'
    },
    {
      id: 'layers',
      label: showLayers ? 'Hide Layers' : 'Show Layers',
      icon: <Layers3 className="w-4 h-4" />,
      shortcut: ['L'],
      action: onToggleLayers || (() => {}),
      description: 'Toggle layers panel',
      category: 'view'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings2 className="w-4 h-4" />,
      shortcut: ['Ctrl', ','],
      action: onSettings || (() => {}),
      description: 'Open application settings',
      category: 'help'
    },
    {
      id: 'help',
      label: 'Help',
      icon: <HelpCircle className="w-4 h-4" />,
      shortcut: ['F1'],
      action: onHelp || (() => {}),
      description: 'Show help and tutorials',
      category: 'help'
    }
  ];

  // Set up keyboard shortcuts
  quickActions.forEach(action => {
    if (action.shortcut) {
      useKeyboardShortcut(action.shortcut, action.action, [action.action]);
    }
  });

  const isActionDisabled = (actionId: string) => {
    switch (actionId) {
      case 'undo':
        return !canUndo;
      case 'redo':
        return !canRedo;
      case 'paste':
        return !canPaste;
      default:
        return false;
    }
  };

  const getActionVariant = (actionId: string) => {
    switch (actionId) {
      case 'grid':
        return isGridVisible ? 'default' : 'outline';
      case 'measure':
        return isMeasureMode ? 'default' : 'outline';
      case 'layers':
        return showLayers ? 'default' : 'outline';
      default:
        return 'outline';
    }
  };

  const categoryColors = {
    edit: 'bg-blue-50 border-blue-200',
    view: 'bg-green-50 border-green-200',
    tool: 'bg-purple-50 border-purple-200',
    help: 'bg-orange-50 border-orange-200'
  };

  return (
    <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Press F1 for help
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Primary Actions (most used) */}
          <div className="flex flex-wrap gap-2">
            {quickActions.slice(0, 4).map(action => (
              <Tooltip 
                key={action.id} 
                content={
                  <div className="text-center">
                    <div className="font-medium">{action.description}</div>
                    {action.shortcut && (
                      <div className="mt-1">
                        <KeyboardShortcut keys={action.shortcut} />
                      </div>
                    )}
                  </div>
                }
              >
                <Button
                  size="sm"
                  variant={getActionVariant(action.id)}
                  onClick={action.action}
                  disabled={isActionDisabled(action.id)}
                  className={`h-9 px-3 transition-all duration-200 ${
                    isActionDisabled(action.id) ? 'opacity-50' : 'hover:scale-105'
                  }`}
                >
                  {action.icon}
                  <span className="ml-2 hidden sm:inline">{action.label}</span>
                </Button>
              </Tooltip>
            ))}
          </div>

          {/* Secondary Actions (grouped by category) */}
          <div className="space-y-3">
            {['view', 'tool', 'help'].map(category => (
              <div key={category} className={`p-2 rounded-lg border ${categoryColors[category as keyof typeof categoryColors]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {category}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {quickActions
                    .filter(action => action.category === category)
                    .map(action => (
                      <Tooltip 
                        key={action.id} 
                        content={
                          <div className="text-center">
                            <div className="font-medium">{action.description}</div>
                            {action.shortcut && (
                              <div className="mt-1">
                                <KeyboardShortcut keys={action.shortcut} />
                              </div>
                            )}
                          </div>
                        }
                      >
                        <Button
                          size="sm"
                          variant={getActionVariant(action.id)}
                          onClick={action.action}
                          disabled={isActionDisabled(action.id)}
                          className={`h-8 px-2 transition-all duration-200 ${
                            isActionDisabled(action.id) ? 'opacity-50' : 'hover:scale-105'
                          }`}
                        >
                          {action.icon}
                          <span className="ml-1 text-xs">{action.label}</span>
                        </Button>
                      </Tooltip>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="pt-2 border-t">
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="text-center">
                <div className="font-medium text-blue-600">CTRL+Z</div>
                <div>Undo</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">G</div>
                <div>Grid</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-600">M</div>
                <div>Measure</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}