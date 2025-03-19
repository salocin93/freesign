/**
 * Toaster Component
 * 
 * A toast notification manager component that handles the rendering and
 * management of toast notifications throughout the application. This component
 * integrates with the toast hook to display and manage toast notifications.
 * 
 * Features:
 * - Automatic toast rendering
 * - Toast stacking
 * - Toast positioning
 * - Toast dismissal
 * - Action button support
 * - Title and description support
 * - Consistent styling
 * 
 * Props:
 * None - This component is self-contained and uses the useToast hook internally
 * 
 * Dependencies:
 * - @/hooks/use-toast: For toast state management
 * - @/components/ui/toast: For toast components
 * 
 * Usage:
 * ```tsx
 * // Add to your app's root layout
 * import { Toaster } from "@/components/ui/toaster"
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <>
 *       {children}
 *       <Toaster />
 *     </>
 *   )
 * }
 * 
 * // Using the toast hook in components
 * import { useToast } from "@/hooks/use-toast"
 * 
 * export function MyComponent() {
 *   const { toast } = useToast()
 * 
 *   const showToast = () => {
 *     toast({
 *       title: "Success",
 *       description: "Operation completed successfully",
 *       action: <ToastAction altText="Try again">Try again</ToastAction>
 *     })
 *   }
 * 
 *   return <Button onClick={showToast}>Show Toast</Button>
 * }
 * ```
 * 
 * Styling:
 * - Inherits styling from Toast components
 * - Viewport positioned at top-right on mobile
 * - Viewport positioned at bottom-right on desktop
 * - Maximum width of 420px on desktop
 * - Customizable through Toast component props
 */

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
