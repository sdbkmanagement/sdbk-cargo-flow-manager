
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-sdbk-green text-white hover:bg-sdbk-green/90 shadow-sdbk-green hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        destructive: "bg-sdbk-red text-white hover:bg-sdbk-red/90 shadow-sdbk-red hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        outline: "border border-gray-200 bg-white hover:bg-gray-50 hover:text-sdbk-blue hover:border-sdbk-blue/50",
        secondary: "bg-sdbk-blue text-white hover:bg-sdbk-blue/90 shadow-sdbk-blue hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        ghost: "hover:bg-gray-100 hover:text-sdbk-blue",
        link: "text-sdbk-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
