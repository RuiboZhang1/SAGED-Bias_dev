import * as React from "react"
import { cn } from "../../utils/utils"
import { ChevronDown } from "lucide-react"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-purple-200 bg-white text-black shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm bg-opacity-95",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 bg-purple-50/50 rounded-t-lg border-b border-purple-200", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-black",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-black leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 bg-purple-50/30 rounded-b-lg", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

interface CollapsibleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  defaultCollapsed?: boolean
  children: React.ReactNode
}

const CollapsibleCard = React.forwardRef<HTMLDivElement, CollapsibleCardProps>(
  ({ className, title, description, defaultCollapsed = false, children, ...props }, ref) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

    return (
      <Card
        ref={ref}
        className={cn("overflow-hidden", className)}
        {...props}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full"
        >
          <CardHeader className="flex flex-row items-center justify-between hover:bg-purple-100/50 transition-colors">
            <div className="space-y-1.5">
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-purple-500 transition-transform duration-200",
                isCollapsed ? "rotate-0" : "rotate-180"
              )}
            />
          </CardHeader>
        </button>
        <div
          className={cn(
            "transition-all duration-200 ease-in-out overflow-hidden",
            isCollapsed ? "max-h-0 opacity-0" : "opacity-100"
          )}
          style={{
            maxHeight: isCollapsed ? '0' : 'none'
          }}
        >
          <CardContent>{children}</CardContent>
        </div>
      </Card>
    )
  }
)
CollapsibleCard.displayName = "CollapsibleCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CollapsibleCard 
} 