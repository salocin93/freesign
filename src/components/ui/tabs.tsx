/**
 * Tabs Components
 * 
 * A collection of tab components built on top of Radix UI's Tabs primitive.
 * These components provide a customizable tab interface with proper accessibility
 * and keyboard navigation support.
 * 
 * Components:
 * - Tabs: Root component for the tabs interface
 * - TabsList: Container for tab triggers
 * - TabsTrigger: Individual tab button
 * - TabsContent: Content panel for each tab
 * 
 * Features:
 * - Accessible tab interface
 * - Keyboard navigation
 * - Focus and hover states
 * - Disabled state styling
 * - Smooth transitions
 * - Custom styling support
 * - ARIA attributes
 * 
 * Props:
 * @param {string} [className] - Additional CSS classes to apply
 * @param {string} [value] - Controlled active tab value
 * @param {string} [defaultValue] - Default active tab value
 * @param {(value: string) => void} [onValueChange] - Callback when tab changes
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard HTML attributes
 * 
 * Dependencies:
 * - @radix-ui/react-tabs: For tabs functionality
 * - @/lib/utils: For class name merging
 * 
 * Usage:
 * ```tsx
 * <Tabs defaultValue="account">
 *   <TabsList>
 *     <TabsTrigger value="account">Account</TabsTrigger>
 *     <TabsTrigger value="password">Password</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="account">
 *     Account settings and preferences
 *   </TabsContent>
 *   <TabsContent value="password">
 *     Change your password
 *   </TabsContent>
 * </Tabs>
 * ```
 * 
 * Styling:
 * - List: Muted background with rounded corners
 * - Trigger: 
 *   - Active: Background color with shadow
 *   - Inactive: Muted text color
 *   - Focus: Ring with offset
 *   - Disabled: 50% opacity
 * - Content: Top margin with focus ring
 * - Customizable through className
 */

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
