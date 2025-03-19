/**
 * ToggleGroup Components
 * 
 * A collection of toggle group components built on top of Radix UI's ToggleGroup primitive.
 * These components provide a customizable group of toggle buttons that can be used
 * for mutually exclusive options or multiple selections.
 * 
 * Components:
 * - ToggleGroup: Root component for the toggle group
 * - ToggleGroupItem: Individual toggle button in the group
 * 
 * Features:
 * - Single or multiple selection modes
 * - Consistent styling across toggles
 * - Shared variant and size context
 * - Keyboard navigation
 * - Focus and hover states
 * - Disabled state styling
 * - Custom styling support
 * 
 * Props:
 * @param {string} [className] - Additional CSS classes to apply
 * @param {string} [type] - Selection type ("single" | "multiple")
 * @param {string} [value] - Controlled selected value(s)
 * @param {string} [defaultValue] - Default selected value(s)
 * @param {(value: string | string[]) => void} [onValueChange] - Callback when value changes
 * @param {string} [variant] - Visual style variant (default/outline)
 * @param {string} [size] - Size variant (default/sm/lg)
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard HTML attributes
 * 
 * Dependencies:
 * - @radix-ui/react-toggle-group: For toggle group functionality
 * - class-variance-authority: For variant management
 * - @/lib/utils: For class name merging
 * - @/components/ui/toggle: For toggle styling
 * 
 * Usage:
 * ```tsx
 * // Single selection
 * <ToggleGroup type="single" defaultValue="center">
 *   <ToggleGroupItem value="left">Left</ToggleGroupItem>
 *   <ToggleGroupItem value="center">Center</ToggleGroupItem>
 *   <ToggleGroupItem value="right">Right</ToggleGroupItem>
 * </ToggleGroup>
 * 
 * // Multiple selection
 * <ToggleGroup type="multiple" defaultValue={["bold", "italic"]}>
 *   <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
 *   <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
 *   <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
 * </ToggleGroup>
 * 
 * // With custom styling
 * <ToggleGroup className="gap-2">
 *   <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
 *   <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
 * </ToggleGroup>
 * ```
 * 
 * Styling:
 * - Group: Flex container with gap
 * - Item: Inherits toggle styling
 * - Active state: Primary color
 * - Focus ring: Primary color
 * - Disabled state: 50% opacity
 * - Customizable through className
 */

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
