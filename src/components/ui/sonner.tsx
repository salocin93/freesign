/**
 * Sonner Toaster Component
 * 
 * A toast notification component built on top of the Sonner library.
 * This component provides a customizable toast notification system with
 * support for different themes and styling options.
 * 
 * Features:
 * - Theme-aware toasts (light/dark/system)
 * - Customizable toast styling
 * - Action and cancel buttons
 * - Automatic positioning
 * - Stacking support
 * - Animation effects
 * - Accessibility features
 * 
 * Props:
 * @param {string} [className] - Additional CSS classes to apply
 * @param {string} [theme] - Theme to use for toasts (light/dark/system)
 * @param {object} [toastOptions] - Options for toast styling and behavior
 * @param {React.ComponentProps<typeof Sonner>} props - Standard Sonner props
 * 
 * Dependencies:
 * - sonner: For toast functionality
 * - next-themes: For theme management
 * 
 * Usage:
 * ```tsx
 * // Basic usage
 * <Toaster />
 * 
 * // With custom options
 * <Toaster
 *   position="top-right"
 *   richColors
 *   expand={true}
 * />
 * 
 * // Using the toast function
 * import { toast } from "sonner"
 * 
 * toast("Hello World")
 * toast.success("Success!")
 * toast.error("Error!")
 * toast.promise(saveData(), {
 *   loading: "Saving...",
 *   success: "Saved!",
 *   error: "Error saving"
 * })
 * ```
 * 
 * Styling:
 * - Toast background: Theme background color
 * - Toast text: Theme foreground color
 * - Toast border: Theme border color
 * - Action button: Primary color
 * - Cancel button: Muted color
 * - Description text: Muted foreground color
 * - Customizable through className and toastOptions
 */

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
