import React from 'react';
import { cn } from '../../utils/utils';
import { Check } from 'lucide-react';

interface ConceptSelectorProps {
    selectedConcepts: string[];
    availableConcepts: string[];
    onChange: (concepts: string[]) => void;
    disabled?: boolean;
}

export const ConceptSelector: React.FC<ConceptSelectorProps> = ({
    selectedConcepts,
    availableConcepts,
    onChange,
    disabled = false
}) => {
    const handleToggleConcept = (concept: string) => {
        if (disabled) return;
        
        if (selectedConcepts.includes(concept)) {
            onChange(selectedConcepts.filter(c => c !== concept));
        } else {
            onChange([...selectedConcepts, concept]);
        }
    };

    return (
        <div className="space-y-2">
            {availableConcepts.map((concept) => {
                const isSelected = selectedConcepts.includes(concept);
                return (
                    <div
                        key={concept}
                        onClick={() => handleToggleConcept(concept)}
                        className={cn(
                            "flex items-center space-x-3 p-2 rounded-md border cursor-pointer select-none",
                            isSelected && "bg-purple-100 border-purple-300",
                            "hover:bg-purple-50",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div className="relative flex items-center justify-center w-5 h-5">
                            <div className={cn(
                                "w-5 h-5 border rounded flex items-center justify-center transition-colors",
                                isSelected 
                                    ? "bg-purple-600 border-purple-600" 
                                    : "border-purple-200 bg-white"
                            )}>
                                {isSelected && (
                                    <Check className="w-4 h-4 text-primary-foreground" />
                                )}
                            </div>
                        </div>
                        <span className="text-sm text-black">{concept}</span>
                    </div>
                );
            })}
            {selectedConcepts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                    No concepts selected. Click to select concepts.
                </p>
            )}
        </div>
    );
}; 