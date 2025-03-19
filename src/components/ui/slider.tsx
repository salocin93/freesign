/**
 * Slider Component
 * 
 * A range slider component built on top of Radix UI's Slider primitive.
 * This component provides a customizable slider input with a track, range,
 * and thumb elements, supporting both single and range values.
 * 
 * Features:
 * - Accessible slider input
 * - Customizable track and thumb styling
 * - Support for single and range values
 * - Touch-friendly interaction
 * - Keyboard navigation
 * - Focus and hover states
 * - Disabled state styling
 * 
 * Props:
 * @param {string} [className] - Additional CSS classes to apply
 * @param {number[]} [defaultValue] - Default value(s) for the slider
 * @param {number[]} [value] - Controlled value(s) for the slider
 * @param {number} [min] - Minimum value of the slider
 * @param {number} [max] - Maximum value of the slider
 * @param {number} [step] - Step value for increments
 * @param {(value: number[]) => void} [onValueChange] - Callback when value changes
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard HTML attributes
 * 
 * Dependencies:
 * - @radix-ui/react-slider: For slider functionality
 * - @/lib/utils: For class name merging
 * 
 * Usage:
 * ```tsx
 * // Basic usage
 * <Slider defaultValue={[50]} max={100} step={1} />
 * 
 * // Range slider
 * <Slider defaultValue={[25, 75]} max={100} step={1} />
 * 
 * // Controlled slider
 * <Slider
 *   value={[value]}
 *   onValueChange={([newValue]) => setValue(newValue)}
 *   max={100}
 * />
 * 
 * // Custom styling
 * <Slider className="w-[200px]" />
 * ```
 * 
 * Styling:
 * - Track: Secondary background color
 * - Range: Primary background color
 * - Thumb: Background color with primary border
 * - Focus ring: Primary color
 * - Disabled state: 50% opacity
 * - Customizable through className
 */

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
