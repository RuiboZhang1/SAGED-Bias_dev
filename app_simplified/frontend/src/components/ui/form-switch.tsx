import React from 'react';
import { cn } from '../../utils/utils';
import { Label } from './label';

interface FormSwitchProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
    activeText?: string;
    inactiveText?: string;
}

export const FormSwitch: React.FC<FormSwitchProps> = ({
    label,
    description,
    checked,
    onChange,
    disabled,
    className,
    activeText = "Enabled",
    inactiveText = "Disabled"
}) => {
    return (
        <div className={cn("flex items-start space-x-4", className)}>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={cn(
                    "relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                    checked 
                        ? "bg-purple-600 shadow-md" 
                        : "bg-gray-300 shadow-sm",
                    disabled && "cursor-not-allowed opacity-50"
                )}
            >
                <span
                    className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-200 ease-in-out absolute top-1 shadow-md",
                        checked 
                            ? "translate-x-6" 
                            : "translate-x-1"
                    )}
                />
            </button>
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold text-gray-800">{label}</Label>
                    <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        checked 
                            ? "bg-green-100 text-green-700 border border-green-200" 
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                    )}>
                        {checked ? activeText : inactiveText}
                    </span>
                </div>
                {description && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}; 