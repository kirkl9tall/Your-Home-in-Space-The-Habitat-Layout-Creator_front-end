import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'secondary' | 'destructive' | 'outline'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        className={cn(
          // Base styles
          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
          
          // Variants
          {
            // Default/Neutral
            "bg-muted text-text ring-muted": 
              variant === 'default' || variant === 'neutral',
            
            // Success - green
            "status-green ring-success/30": 
              variant === 'success',
            
            // Warning - amber  
            "status-amber ring-warning/30": 
              variant === 'warning',
            
            // Danger - red
            "status-red ring-danger/30": 
              variant === 'danger' || variant === 'destructive',
              
            // Secondary - muted
            "bg-secondary text-secondary-foreground ring-secondary":
              variant === 'secondary',
              
            // Outline - border only
            "border border-primary text-primary bg-transparent ring-primary/30":
              variant === 'outline',
          },
          
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }