/**
 * Button Component
 * 
 * A versatile button component built on top of Radix UI's Slot primitive.
 * This component provides various styles and sizes for different use cases
 * throughout the application.
 * 
 * Features:
 * - Multiple variants (default, destructive, outline, secondary, ghost, link)
 * - Different sizes (default, sm, lg, icon)
 * - Support for icons with automatic sizing
 * - Focus and hover states
 * - Disabled state styling
 * - Polymorphic rendering (can render as different elements)
 * 
 * Props:
 * @param {string} [className] - Additional CSS classes to apply
 * @param {ButtonVariant} [variant] - Visual style variant of the button
 * @param {ButtonSize} [size] - Size variant of the button
 * @param {boolean} [asChild] - Whether to render as a child component
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} props - Standard button HTML attributes
 * 
 * Variants:
 * - default: Primary action button with solid background
 * - destructive: For dangerous actions (e.g., delete)
 * - outline: Bordered button with transparent background
 * - secondary: Alternative style for secondary actions
 * - ghost: Transparent button with hover effect
 * - link: Text-only button styled as a link
 * 
 * Sizes:
 * - default: Standard size (h-10)
 * - sm: Small size (h-9)
 * - lg: Large size (h-11)
 * - icon: Square button for icons (h-10 w-10)
 * 
 * Dependencies:
 * - @radix-ui/react-slot: For polymorphic rendering
 * - class-variance-authority: For variant management
 * - @/lib/utils: For class name merging
 * 
 * Usage:
 * ```tsx
 * // Basic usage
 * <Button>Click me</Button>
 * 
 * // With variant and size
 * <Button variant="destructive" size="lg">
 *   Delete
 * </Button>
 * 
 * // With icon
 * <Button>
 *   <IconComponent />
 *   With Icon
 * </Button>
 * 
 * // As a link
 * <Button variant="link" asChild>
 *   <Link href="/somewhere">Go to Link</Link>
 * </Button>
 * ```
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
