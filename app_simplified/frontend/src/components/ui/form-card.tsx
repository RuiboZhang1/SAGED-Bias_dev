import React from 'react';
import { cn } from '../../utils/utils';

interface FormCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    variant?: 'default' | 'nested';
}

export const FormCard: React.FC<FormCardProps> = ({
    title,
    description,
    children,
    icon,
    variant = 'default',
    className,
    ...props
}) => {
    const isNested = variant === 'nested';
    
    return (
        <div
            className={cn(
                "rounded-lg border bg-white text-black shadow-lg transition-all duration-200",
                isNested 
                    ? "border-purple-300 bg-purple-50/30 shadow-md" 
                    : "border-purple-200 bg-white/95 backdrop-blur-sm hover:shadow-xl",
                className
            )}
            {...props}
        >
            <div className={cn("space-y-6", isNested ? "p-4" : "p-6")}>
                <div className={cn(
                    "space-y-3 border-b pb-4",
                    isNested ? "border-purple-300/50" : "border-purple-200"
                )}>
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="flex-shrink-0 w-6 h-6 text-purple-600">
                                {icon}
                            </div>
                        )}
                        <h3 className={cn(
                            "font-bold leading-tight tracking-tight text-gray-900",
                            isNested ? "text-base" : "text-lg"
                        )}>
                            {title}
                        </h3>
                    </div>
                    {description && (
                        <p className={cn(
                            "text-gray-600 leading-relaxed font-medium",
                            isNested ? "text-xs" : "text-sm"
                        )}>
                            {description}
                        </p>
                    )}
                </div>
                
                <div className={cn(
                    "rounded-lg",
                    isNested 
                        ? "bg-white/60 p-4 border border-purple-200/50" 
                        : "bg-purple-50/30 p-5"
                )}>
                    {children}
                </div>
            </div>
        </div>
    );
}; 