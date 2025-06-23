import React from 'react';
import { cn } from '../../utils/utils';
import { Label } from './label.tsx';
import { Input } from './input.tsx';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    description?: string;
    isLoading?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    error,
    description,
    isLoading,
    className,
    id,
    ...props
}) => {
    const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div className="space-y-3">
            <Label 
                htmlFor={inputId} 
                className="text-sm font-semibold text-gray-800 block"
            >
                {label}
            </Label>
            
            <div className="relative">
                <Input
                    id={inputId}
                    className={cn(
                        "w-full transition-colors duration-200",
                        "border-gray-300 focus:border-purple-500 focus:ring-purple-500",
                        "placeholder:text-gray-400",
                        "text-gray-900 font-medium",
                        error && "border-red-400 focus:border-red-500 focus:ring-red-500",
                        isLoading && "opacity-50 cursor-not-allowed",
                        className
                    )}
                    disabled={isLoading}
                    {...props}
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                    </div>
                )}
            </div>
            
            {description && (
                <p className="text-sm text-gray-600 leading-relaxed font-normal mt-2">
                    {description}
                </p>
            )}
            
            {error && (
                <p className="text-sm font-semibold text-red-600 mt-2 flex items-center gap-1">
                    <span className="inline-block w-4 h-4 text-red-500">⚠</span>
                    {error}
                </p>
            )}
        </div>
    );
}; 