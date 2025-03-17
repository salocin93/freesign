/**
 * Badge Component
 * 
 * A versatile badge component that can be used to display status, labels, or small pieces of information.
 * It supports multiple variants and can be customized through className props.
 * 
 * Features:
 * - Multiple variants (default, secondary, destructive, outline)
 * - Customizable through className prop
 * - Accessible focus states
 * - Responsive design
 * 
 * @component
 * @example
 * ```tsx
 * // Default badge
 * <Badge>New</Badge>
 * 
 * // Secondary badge
 * <Badge variant="secondary">Beta</Badge>
 * 
 * // Destructive badge
 * <Badge variant="destructive">Error</Badge>
 * 
 * // Outline badge
 * <Badge variant="outline">Draft</Badge>
 * 
 * // Custom className
 * <Badge className="bg-purple-500">Custom</Badge>
 * ```
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Props for the Badge component
 * Extends HTML div attributes and includes variant props
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component that displays a small piece of information with different style variants
 * 
 * @param className - Additional CSS classes to apply
 * @param variant - The style variant to use (default, secondary, destructive, outline)
 * @param props - Additional HTML div props
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
