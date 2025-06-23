import React from 'react';
import { cn } from '../../utils/utils';

interface SectionHeaderProps {
    stepNumber: number;
    title: string;
    description?: string;
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    stepNumber,
    title,
    description,
    className
}) => {
    return (
        <div className={cn("space-y-1.5", className)}>
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm">
                    {stepNumber}
                </div>
                <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
            </div>
            {description && (
                <p className="text-sm text-gray-600 pl-11">{description}</p>
            )}
        </div>
    );
}; 