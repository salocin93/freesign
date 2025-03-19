/**
 * Input Component
 * 
 * A styled input component that provides a consistent look and feel
 * for text input fields across the application. This component extends
 * the native HTML input element with custom styling and accessibility features.
 * 
 * Features:
 * - Consistent styling with the design system
 * - Focus and hover states
 * - Disabled state styling
 * - File input styling
 * - Responsive text size
 * - Accessible focus ring
 * - Placeholder text styling
 * 
 * Props:
 * @param {string} [className] - Additional CSS classes to apply
 * @param {string} [type] - Input type (text, email, password, etc.)
 * @param {React.InputHTMLAttributes<HTMLInputElement>} props - Standard input HTML attributes
 * 
 * Styling:
 * - Height: 40px (h-10)
 * - Border radius: 6px (rounded-md)
 * - Padding: 12px horizontal, 8px vertical
 * - Focus ring: 2px with offset
 * - Disabled state: 50% opacity
 * - Responsive text: 16px on mobile, 14px on desktop
 * 
 * Dependencies:
 * - @/lib/utils: For class name merging
 * 
 * Usage:
 * ```tsx
 * // Basic text input
 * <Input placeholder="Enter text..." />
 * 
 * // Email input
 * <Input type="email" placeholder="Enter email..." />
 * 
 * // Password input
 * <Input type="password" placeholder="Enter password..." />
 * 
 * // File input
 * <Input type="file" accept="image/*" />
 * 
 * // With custom class
 * <Input className="w-64" />
 * ```
 */

import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
