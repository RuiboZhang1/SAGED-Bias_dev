import React from 'react';
import { cn } from '../../utils/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className, type, ...props }) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-11 w-full rounded-md border-2 border-gray-300 bg-white px-4 py-3",
                "text-sm font-medium text-gray-900 leading-none",
                "placeholder:text-gray-400 placeholder:font-normal",
                "transition-all duration-200 ease-in-out",
                "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
                "hover:border-gray-400",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                className
            )}
            {...props}
        />
    );
}; 