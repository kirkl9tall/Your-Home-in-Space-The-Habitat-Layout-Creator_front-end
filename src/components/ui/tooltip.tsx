import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: React.ReactNode
  content: string | React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delayDuration?: number
}

export function Tooltip({ 
  children, 
  content, 
  side = "top", 
  align = "center",
  delayDuration = 200 
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [timeoutId, setTimeoutId] = React.useState<number | null>(null)

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delayDuration)
    setTimeoutId(id)
  }

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setIsVisible(false)
  }

  const getTooltipClasses = () => {
    const baseClasses = "absolute z-50 px-3 py-1.5 text-sm text-white bg-gray-900 rounded-md shadow-lg transition-opacity duration-200 pointer-events-none"
    
    const sideClasses = {
      top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2", 
      left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
      right: "left-full top-1/2 transform -translate-y-1/2 ml-2"
    }

    const alignClasses = {
      start: side === "top" || side === "bottom" ? "left-0 transform-none" : "top-0 transform-none",
      center: "",
      end: side === "top" || side === "bottom" ? "right-0 transform-none" : "bottom-0 transform-none"
    }

    return cn(
      baseClasses,
      sideClasses[side],
      align !== "center" && alignClasses[align],
      isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
    )
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      <div className={getTooltipClasses()}>
        {content}
        {/* Arrow */}
        <div className={cn(
          "absolute w-2 h-2 bg-gray-900 rotate-45",
          side === "top" && "top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2",
          side === "bottom" && "bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2",
          side === "left" && "left-full top-1/2 transform -translate-x-1/2 -translate-y-1/2",
          side === "right" && "right-full top-1/2 transform translate-x-1/2 -translate-y-1/2"
        )} />
      </div>
    </div>
  )
}