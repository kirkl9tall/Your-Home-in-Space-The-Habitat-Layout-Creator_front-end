import * as React from "react"
import { cn } from "@/lib/utils"

interface KeyboardShortcutProps {
  keys: string[]
  className?: string
}

export function KeyboardShortcut({ keys, className }: KeyboardShortcutProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-muted px-1 text-[10px] font-medium text-muted-foreground">
            {key}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-muted-foreground text-xs">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Hook for keyboard shortcuts
export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  deps: React.DependencyList = []
) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyCombo = keys.map(key => {
        switch (key.toLowerCase()) {
          case 'ctrl':
          case 'control':
            return event.ctrlKey
          case 'shift':
            return event.shiftKey
          case 'alt':
            return event.altKey
          case 'meta':
          case 'cmd':
            return event.metaKey
          default:
            return event.key.toLowerCase() === key.toLowerCase()
        }
      })

      if (keyCombo.every(Boolean)) {
        event.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, deps)
}