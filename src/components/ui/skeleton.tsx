/**
 * Skeleton Component
 * 
 * A loading placeholder component that provides a pulsing animation effect.
 * This component is commonly used to show loading states for content that
 * is being fetched or processed.
 * 
 * Features:
 * - Pulsing animation effect
 * - Customizable size through className
 * - Rounded corners
 * - Muted background color
 * - Flexible width and height
 * 
 * Props:
 * @param {string} [className] - Additional CSS classes to apply
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard HTML attributes
 * 
 * Dependencies:
 * - @/lib/utils: For class name merging
 * 
 * Usage:
 * ```tsx
 * // Basic usage
 * <Skeleton className="h-4 w-[250px]" />
 * 
 * // Card skeleton
 * <div className="space-y-3">
 *   <Skeleton className="h-4 w-[80%]" />
 *   <Skeleton className="h-4 w-[60%]" />
 *   <Skeleton className="h-4 w-[40%]" />
 * </div>
 * 
 * // Avatar skeleton
 * <Skeleton className="h-12 w-12 rounded-full" />
 * ```
 * 
 * Styling:
 * - Background: Muted color
 * - Animation: Pulse effect
 * - Border radius: Medium (rounded-md)
 * - Customizable through className
 */

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
