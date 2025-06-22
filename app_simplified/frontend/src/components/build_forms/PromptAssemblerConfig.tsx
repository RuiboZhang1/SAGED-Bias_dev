import React, { useState } from 'react';
import { DomainBenchmarkConfig } from '../../types/saged_config';
import { FormCard } from '../ui/form-card';
import { FormField } from '../ui/form-field';
import { Select } from '../ui/select';
import { FormSwitch } from '../ui/form-switch';
import { Button } from '../ui/button';
import PromptAssemblerBranching from './PromptAssemblerBranching';

interface PromptAssemblerConfigProps {
    config: DomainBenchmarkConfig;
    onConfigChange: (newConfig: DomainBenchmarkConfig) => void;
}

const PromptAssemblerConfig: React.FC<PromptAssemblerConfigProps> = ({ config, onConfigChange }) => {
    // Local state to control branching UI visibility
    const [showBranching, setShowBranching] = useState(false);
    // Confirmation and collapse state
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Updates shared_config.prompt_assembler.method
    const handleMethodChange = (value: string) => {
        onConfigChange({
            ...config,
            shared_config: {
                ...config.shared_config,
                prompt_assembler: {
                    ...config.shared_config.prompt_assembler,
                    method: value
                }
            }
        });
    };

    // Updates shared_config.prompt_assembler.max_benchmark_length
    const handleMaxBenchmarkLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onConfigChange({
            ...config,
            shared_config: {
                ...config.shared_config,
                prompt_assembler: {
                    ...config.shared_config.prompt_assembler,
                    max_benchmark_length: parseInt(e.target.value) || 0
                }
            }
        });
    };

    // Handle clicking on the collapsed header to expand
    const handleHeaderClick = () => {
        if (isConfirmed && isCollapsed) {
            setIsCollapsed(false);
        }
    };

    // Handle edit/modify button click
    const handleEdit = () => {
        setIsConfirmed(false);
        setIsCollapsed(false);
    };

    // Handle confirm button click
    const handleConfirm = () => {
        setIsConfirmed(true);
        setIsCollapsed(true);
    };

    // Create title with confirmation status
    const getTitle = () => {
        if (isConfirmed) {
            return (
                <div className="flex items-center space-x-2">
                    <span>Prompt Assembly Configuration</span>
                    <div className="flex items-center space-x-1 text-green-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Confirmed</span>
                    </div>
                </div>
            );
        }
        return "Assemble Prompts";
    };

    // Create description with configuration summary when collapsed
    const getDescription = () => {
        if (isConfirmed && isCollapsed) {
            const method = config.shared_config.prompt_assembler.method || "questions";
            const maxLength = config.shared_config.prompt_assembler.max_benchmark_length;
            const hasBranching = config.branching && Object.keys(config.branching_config?.replacement_description || {}).length > 0;
            
            return (
                <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                        Method: <span className="font-medium capitalize">{method.replace('_', ' ')}</span>
                    </p>
                    <div className="flex items-center space-x-4">
                        <p className="text-sm text-gray-600">
                            Max Length: <span className="font-medium">{maxLength || 'Unlimited'}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                            Variations: <span className="font-medium">{hasBranching ? 'Enabled' : 'Disabled'}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return "Choose how you want your prompts to be like.";
    };

    return (
        <FormCard
            title={getTitle()}
            description={getDescription()}
            className="mb-6"
            isCollapsed={isCollapsed}
            onHeaderClick={handleHeaderClick}
            headerActions={isConfirmed && (
                <Button 
                    onClick={handleEdit} 
                    variant="outline" 
                    size="sm"
                    className="ml-auto"
                >
                    Modify
                </Button>
            )}
        >
            <div className="space-y-6">
                <div className="space-y-6">
                    {/* Input for shared_config.prompt_assembler.method */}
                    <div className="space-y-3">
                        <label className="text-base font-semibold text-gray-900">Processing Method</label>
                        <div className="text-xs text-gray-600 mb-3">
                            Choose how to transform your prompts:
                        </div>
                        <ul className="list-disc pl-5 mb-3 text-xs text-gray-600 space-y-1">
                            <li><strong>Questions:</strong> Converts sentences into questions while maintaining the original meaning and ensuring the topic is included.</li>
                            <li><strong>Split Sentences:</strong> Intelligently splits sentences at natural break points after verbs, creating two related parts that maintain context.</li>
                        </ul>
                        <Select
                            value={config.shared_config.prompt_assembler.method || "questions"}
                            onValueChange={handleMethodChange}
                            disabled={isConfirmed}
                        >
                            <option value="questions">Questions</option>
                            <option value="split_sentences">Split Sentences</option>
                        </Select>
                    </div>

                    {/* Input for shared_config.prompt_assembler.max_benchmark_length */}
                    <FormField
                        label="Max Benchmark Length"
                        type="number"
                        value={config.shared_config.prompt_assembler.max_benchmark_length}
                        onChange={handleMaxBenchmarkLengthChange}
                        placeholder="Enter maximum benchmark length"
                        description="Set the maximum number of prompts to generate. Leave empty for unlimited."
                        disabled={isConfirmed}
                    />

                    {/* Controls visibility of branching configuration */}
                    <div className="space-y-6 pt-6 border-t border-gray-200">
                        <div className="space-y-3">
                            <h3 className="text-base font-semibold text-gray-900">Advanced Options</h3>
                            <FormSwitch
                                label="Enable Variations"
                                checked={showBranching}
                                onChange={(checked) => setShowBranching(checked)}
                                description="Create diverse variations of prompts by replacing key terms with related ones. This helps generate multiple perspectives while maintaining context."
                                disabled={isConfirmed}
                            />
                        </div>

                        {/* Renders PromptAssemblerBranching component when branching is enabled */}
                        {showBranching && !isConfirmed && (
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <PromptAssemblerBranching
                                    config={config}
                                    onConfigChange={onConfigChange}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Confirmation button */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                    {!isConfirmed ? (
                        <Button
                            onClick={handleConfirm}
                            variant="primary"
                            size="lg"
                            className="px-8 py-3 font-semibold shadow-lg"
                        >
                            Confirm Configuration
                        </Button>
                    ) : (
                        <Button
                            onClick={handleEdit}
                            variant="outline"
                            className="px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
                        >
                            Edit Configuration
                        </Button>
                    )}
                </div>
            </div>
        </FormCard>
    );
};

export default PromptAssemblerConfig;