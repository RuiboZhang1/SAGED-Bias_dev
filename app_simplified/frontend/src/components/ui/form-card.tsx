import React from 'react';
import { cn } from '../../utils/utils';

interface FormCardProps {
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    children: React.ReactNode;
    icon?: React.ReactNode;
    variant?: 'default' | 'nested';
    isCollapsed?: boolean;
    onHeaderClick?: () => void;
    headerActions?: React.ReactNode;
    className?: string;
}

export const FormCard: React.FC<FormCardProps> = ({
    title,
    description,
    children,
    icon,
    variant = 'default',
    className,
    isCollapsed = false,
    onHeaderClick,
    headerActions,
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
        >
            <div className={cn("space-y-6", isNested ? "p-4" : "p-6")}>
                <div 
                    className={cn(
                        "space-y-3 border-b pb-4",
                        isNested ? "border-purple-300/50" : "border-purple-200",
                        onHeaderClick && isCollapsed ? "cursor-pointer hover:bg-gray-50 rounded-md p-2 -mx-2" : ""
                    )}
                    onClick={onHeaderClick}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
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
                        <div className="flex items-center space-x-2">
                            {headerActions}
                            {onHeaderClick && (
                                <div className="flex-shrink-0 w-5 h-5 text-gray-400">
                                    <svg 
                                        className={cn(
                                            "w-5 h-5 transition-transform duration-200",
                                            isCollapsed ? "rotate-180" : ""
                                        )}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            )}
                        </div>
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
                
                {!isCollapsed && (
                    <div className={cn(
                        "rounded-lg",
                        isNested 
                            ? "bg-white/60 p-4 border border-purple-200/50" 
                            : "bg-purple-50/30 p-5"
                    )}>
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}; 