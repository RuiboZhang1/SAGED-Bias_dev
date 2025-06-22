import * as React from "react"
import { cn } from "../../utils/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg'
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm",
      primary: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm",
      secondary: "bg-purple-100 text-purple-900 hover:bg-purple-200 shadow-sm",
      outline: "border-2 border-purple-200 bg-white text-purple-900 hover:bg-purple-50 hover:border-purple-300",
      ghost: "text-purple-700 hover:bg-purple-100 hover:text-purple-900",
      link: "text-purple-600 underline-offset-4 hover:text-purple-700 hover:underline"
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8"
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isLoading && "opacity-50 cursor-not-allowed",
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button } 