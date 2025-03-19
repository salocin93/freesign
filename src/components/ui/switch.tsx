/**
 * Switch Component
 * 
 * A toggle switch component built on top of Radix UI's Switch primitive.
 * This component provides a customizable toggle switch with smooth animations
 * and proper accessibility features.
 * 
 * Features:
 * - Accessible toggle switch
 * - Smooth sliding animation
 * - Keyboard navigation
 * - Focus and hover states
 * - Disabled state styling
 * - Custom styling support
 * - ARIA attributes
 * 
 * Props:
 * @param {string} [className] - Additional CSS classes to apply
 * @param {boolean} [checked] - Controlled checked state
 * @param {boolean} [defaultChecked] - Default checked state
 * @param {boolean} [disabled] - Whether the switch is disabled
 * @param {(checked: boolean) => void} [onCheckedChange] - Callback when checked state changes
 * @param {React.HTMLAttributes<HTMLButtonElement>} props - Standard HTML attributes
 * 
 * Dependencies:
 * - @radix-ui/react-switch: For switch functionality
 * - @/lib/utils: For class name merging
 * 
 * Usage:
 * ```tsx
 * // Basic usage
 * <Switch />
 * 
 * // Controlled switch
 * <Switch
 *   checked={isEnabled}
 *   onCheckedChange={setIsEnabled}
 * />
 * 
 * // Disabled switch
 * <Switch disabled />
 * 
 * // With label
 * <div className="flex items-center space-x-2">
 *   <Switch id="airplane-mode" />
 *   <Label htmlFor="airplane-mode">
 *     Airplane Mode
 *   </Label>
 * </div>
 * ```
 * 
 * Styling:
 * - Track: Input color when unchecked, primary color when checked
 * - Thumb: Background color with shadow
 * - Focus ring: Primary color
 * - Disabled state: 50% opacity
 * - Customizable through className
 */

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
