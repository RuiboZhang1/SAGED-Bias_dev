import * as React from "react"
import { cn } from "../../utils/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'upload'
  size?: 'default' | 'sm' | 'lg'
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
    
    const variants = {
      default: "bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500 shadow-md hover:shadow-lg",
      primary: "bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500 shadow-md hover:shadow-lg",
      secondary: "bg-purple-100 text-purple-900 hover:bg-purple-200 focus-visible:ring-purple-500 shadow-sm hover:shadow-md border border-purple-200",
      outline: "border-2 border-purple-300 bg-white text-purple-700 hover:bg-purple-50 hover:border-purple-400 focus-visible:ring-purple-500 hover:shadow-sm",
      upload: "border-2 border-dashed border-purple-300 bg-purple-50/50 text-purple-700 hover:bg-purple-100 hover:border-purple-400 focus-visible:ring-purple-500 hover:shadow-sm font-medium",
      ghost: "text-purple-700 hover:bg-purple-100 hover:text-purple-900 focus-visible:ring-purple-500",
      link: "text-purple-600 underline-offset-4 hover:text-purple-700 hover:underline focus-visible:ring-purple-500"
    }

    const sizes = {
      default: "h-11 px-6 py-3 text-sm",
      sm: "h-9 rounded-md px-4 py-2 text-sm",
      lg: "h-12 rounded-md px-8 py-3 text-base"
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isLoading && "opacity-70 cursor-not-allowed pointer-events-none",
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="opacity-70">Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button } 