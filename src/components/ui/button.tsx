import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'surface' | 'ghost' | 'danger' | 'outline' | 'link' | 'destructive' | 'secondary'
  size?: 'default' | 'sm' | 'md' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center whitespace-nowrap font-medium focus-ring transition-smooth",
          "disabled:pointer-events-none disabled:opacity-50",
          
          // Variants
          {
            // Default/Primary - NASA blue
            "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-md": 
              variant === 'default' || variant === 'primary',
            
            // Surface - subtle background
            "bg-surface text-text border border-muted hover:bg-muted active:bg-muted/80": 
              variant === 'surface',
            
            // Ghost - no background
            "text-text hover:bg-muted active:bg-muted/80": 
              variant === 'ghost',
            
            // Danger - red variant
            "bg-danger text-primary-foreground hover:bg-danger/90 active:bg-danger/80 shadow-md": 
              variant === 'danger' || variant === 'destructive',
            
            // Outline - border only
            "border border-primary text-primary hover:bg-primary hover:text-primary-foreground active:bg-primary/80": 
              variant === 'outline',
            
            // Link - text only
            "text-primary underline-offset-4 hover:underline": 
              variant === 'link',
              
            // Secondary - muted background
            "bg-secondary text-secondary-foreground hover:bg-secondary/80":
              variant === 'secondary',
          },
          
          // Sizes
          {
            "h-8 px-3 text-sm rounded-sm": size === 'sm',
            "h-10 px-4 text-sm rounded-md": size === 'default' || size === 'md',
            "h-12 px-6 text-base rounded-lg": size === 'lg',
            "h-10 w-10 rounded-md": size === 'icon',
          },
          
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }