/**
 * Form Components
 * 
 * A collection of form components built on top of React Hook Form and Radix UI.
 * These components provide a complete form solution with validation, accessibility,
 * and consistent styling.
 * 
 * Components:
 * - Form: Root form provider component
 * - FormField: Field wrapper with form control integration
 * - FormItem: Container for form field elements
 * - FormLabel: Label component for form fields
 * - FormControl: Control wrapper for form inputs
 * - FormDescription: Helper text for form fields
 * - FormMessage: Error message display
 * 
 * Features:
 * - Form validation with React Hook Form
 * - Accessible form controls
 * - Error state handling
 * - Custom styling support
 * - Type-safe form fields
 * - Automatic ID generation
 * - ARIA attributes management
 * 
 * Props:
 * @param {string} [className] - Additional CSS classes to apply
 * @param {React.ReactNode} children - Content to render
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard HTML attributes
 * 
 * Dependencies:
 * - @radix-ui/react-label: For accessible labels
 * - @radix-ui/react-slot: For polymorphic rendering
 * - react-hook-form: For form handling and validation
 * - @/lib/utils: For class name merging
 * - @/components/ui/label: For label styling
 * 
 * Usage:
 * ```tsx
 * import { useForm } from "react-hook-form"
 * 
 * const form = useForm({
 *   defaultValues: {
 *     username: "",
 *   },
 * })
 * 
 * <Form {...form}>
 *   <form onSubmit={form.handleSubmit(onSubmit)}>
 *     <FormField
 *       control={form.control}
 *       name="username"
 *       render={({ field }) => (
 *         <FormItem>
 *           <FormLabel>Username</FormLabel>
 *           <FormControl>
 *             <Input placeholder="Enter username" {...field} />
 *           </FormControl>
 *           <FormDescription>
 *             This is your public display name.
 *           </FormDescription>
 *           <FormMessage />
 *         </FormItem>
 *       )}
 *     />
 *     <Button type="submit">Submit</Button>
 *   </form>
 * </Form>
 * ```
 * 
 * Styling:
 * - Form items: Vertical spacing between elements
 * - Labels: Destructive color on error
 * - Messages: Destructive color for errors
 * - Descriptions: Muted text color
 * - Controls: Inherits input styling
 */

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
