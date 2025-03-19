/**
 * Textarea Component
 * 
 * A styled textarea component that provides a consistent look and feel
 * for multi-line text input fields across the application. This component
 * extends the native HTML textarea element with custom styling and
 * accessibility features.
 * 
 * Features:
 * - Consistent styling with the design system
 * - Focus and hover states
 * - Disabled state styling
 * - Placeholder text styling
 * - Minimum height for better UX
 * - Accessible focus ring
 * - Responsive text size
 * 
 * Props:
 * @param {string} [className] - Additional CSS classes to apply
 * @param {string} [placeholder] - Placeholder text
 * @param {boolean} [disabled] - Whether the textarea is disabled
 * @param {number} [rows] - Number of visible text lines
 * @param {React.TextareaHTMLAttributes<HTMLTextAreaElement>} props - Standard textarea HTML attributes
 * 
 * Styling:
 * - Height: Minimum 80px
 * - Border radius: 6px (rounded-md)
 * - Padding: 12px horizontal, 8px vertical
 * - Focus ring: 2px with offset
 * - Disabled state: 50% opacity
 * - Responsive text: 14px
 * - Placeholder: Muted foreground color
 * 
 * Dependencies:
 * - @/lib/utils: For class name merging
 * 
 * Usage:
 * ```tsx
 * // Basic usage
 * <Textarea placeholder="Type your message here..." />
 * 
 * // With rows
 * <Textarea rows={5} placeholder="Longer text..." />
 * 
 * // Disabled state
 * <Textarea disabled placeholder="Cannot edit" />
 * 
 * // With custom class
 * <Textarea className="min-h-[200px]" />
 * ```
 */

import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
