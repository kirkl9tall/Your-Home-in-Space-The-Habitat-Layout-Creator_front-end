import * as React from "react"
import { cn } from "../../utils"

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, onValueChange, min = 0, max = 100, step = 1, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([parseFloat(e.target.value)])
    }

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0] || min}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
        />
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }