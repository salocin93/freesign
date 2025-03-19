/**
 * Table Components
 * 
 * A collection of table components that provide a consistent and accessible
 * way to display tabular data. These components are built on top of native
 * HTML table elements with enhanced styling and functionality.
 * 
 * Components:
 * - Table: Root table container with overflow handling
 * - TableHeader: Header section of the table
 * - TableBody: Main content section of the table
 * - TableFooter: Footer section of the table
 * - TableRow: Individual row component
 * - TableHead: Header cell component
 * - TableCell: Data cell component
 * - TableCaption: Table caption component
 * 
 * Features:
 * - Responsive design with horizontal scrolling
 * - Hover and selected states for rows
 * - Consistent spacing and alignment
 * - Support for checkboxes and other interactive elements
 * - Accessible table structure
 * - Custom styling support
 * 
 * Props:
 * @param {string} [className] - Additional CSS classes to apply
 * @param {React.HTMLAttributes<HTMLTableElement>} props - Standard HTML attributes
 * 
 * Dependencies:
 * - @/lib/utils: For class name merging
 * 
 * Usage:
 * ```tsx
 * <Table>
 *   <TableCaption>A list of your recent invoices.</TableCaption>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Invoice</TableHead>
 *       <TableHead>Status</TableHead>
 *       <TableHead>Method</TableHead>
 *       <TableHead>Amount</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>INV001</TableCell>
 *       <TableCell>Paid</TableCell>
 *       <TableCell>Credit Card</TableCell>
 *       <TableCell>$250.00</TableCell>
 *     </TableRow>
 *   </TableBody>
 *   <TableFooter>
 *     <TableRow>
 *       <TableCell colSpan={3}>Total</TableCell>
 *       <TableCell>$250.00</TableCell>
 *     </TableRow>
 *   </TableFooter>
 * </Table>
 * ```
 * 
 * Styling:
 * - Table: Full width with overflow handling
 * - Header: Bottom border for rows
 * - Body: No border for last row
 * - Footer: Top border with muted background
 * - Row: Bottom border with hover state
 * - Head cell: Left-aligned with medium font weight
 * - Cell: Consistent padding
 * - Caption: Muted text color
 * - Customizable through className
 */

import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
