
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-sdbk-green text-white shadow-sm",
        secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
        destructive: "border-transparent bg-sdbk-red text-white shadow-sm",
        outline: "text-gray-700 border-gray-200 bg-white",
        success: "border-transparent bg-green-500 text-white shadow-sm",
        warning: "border-transparent bg-yellow-500 text-white shadow-sm",
        error: "border-transparent bg-red-500 text-white shadow-sm",
        info: "border-transparent bg-blue-500 text-white shadow-sm",
        available: "border-transparent bg-green-500 text-white shadow-sm",
        unavailable: "border-transparent bg-red-500 text-white shadow-sm",
        pending: "border-transparent bg-yellow-500 text-white shadow-sm",
        maintenance: "border-transparent bg-orange-500 text-white shadow-sm",
        mission: "border-transparent bg-blue-500 text-white shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
