/**
 * Tooltip Components
 * 
 * A collection of tooltip components built on top of Radix UI's Tooltip primitive.
 * These components provide accessible tooltips with customizable positioning and animations.
 * 
 * Components:
 * - TooltipProvider: Context provider for tooltip functionality
 * - Tooltip: Root component for the tooltip
 * - TooltipTrigger: Element that triggers the tooltip
 * - TooltipContent: The actual tooltip content
 * 
 * Features:
 * - Accessible tooltips with ARIA attributes
 * - Customizable positioning (top, right, bottom, left)
 * - Smooth animations for show/hide
 * - Automatic positioning based on available space
 * - Keyboard navigation support
 * - Custom styling support
 * 
 * Props:
 * @param {string} [className] - Additional CSS classes to apply
 * @param {number} [sideOffset=4] - Distance between the trigger and content
 * @param {React.ReactNode} children - Content to render
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard HTML attributes
 * 
 * Dependencies:
 * - @radix-ui/react-tooltip: For tooltip functionality
 * - @/lib/utils: For class name merging
 * 
 * Usage:
 * ```tsx
 * <TooltipProvider>
 *   <Tooltip>
 *     <TooltipTrigger>
 *       <Button>Hover me</Button>
 *     </TooltipTrigger>
 *     <TooltipContent>
 *       <p>This is a tooltip</p>
 *     </TooltipContent>
 *   </Tooltip>
 * </TooltipProvider>
 * ```
 * 
 * Styling:
 * - Background: Popover background color
 * - Text: Popover foreground color
 * - Border: Light border
 * - Shadow: Medium shadow
 * - Animation: Fade and zoom effects
 * - Positioning: Automatic based on available space
 */

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
