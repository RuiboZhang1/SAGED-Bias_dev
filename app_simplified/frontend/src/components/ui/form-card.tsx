import React from 'react';
import { cn } from '../../utils/utils';

interface FormCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    children: React.ReactNode;
}

export const FormCard: React.FC<FormCardProps> = ({
    title,
    description,
    children,
    className,
    ...props
}) => {
    return (
        <div
            className={cn(
                "rounded-lg border border-purple-200 bg-white/95 backdrop-blur-sm text-black shadow-lg hover:shadow-xl transition-all duration-200",
                className
            )}
            {...props}
        >
            <div className="p-6 space-y-4">
                <div className="space-y-1 border-b border-purple-200 pb-4">
                    <h3 className="text-lg font-semibold leading-none tracking-tight text-black">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-sm text-black leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
                <div className="bg-purple-50/50 rounded-lg p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}; 