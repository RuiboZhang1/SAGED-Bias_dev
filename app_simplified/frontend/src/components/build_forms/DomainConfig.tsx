import React, { useState } from 'react';
import { DomainBenchmarkConfig } from '../../types/saged_config';
import { FormCard } from '../ui/form-card';
import { FormField } from '../ui/form-field';
import { Input } from '../ui/input';
import { ConceptList } from '../ui/concept-list';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';
import { FormSwitch } from '../ui/form-switch';
import KeywordFinderConfig from './KeywordFinderConfig';

interface DomainConfigProps {
    config: DomainBenchmarkConfig;
    onConfigChange: (config: DomainBenchmarkConfig) => void;
}

const DomainConfig: React.FC<DomainConfigProps> = ({ config, onConfigChange }) => {
    const [tempConfig, setTempConfig] = useState<DomainBenchmarkConfig>(config);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
    const [showKeywordFinder, setShowKeywordFinder] = useState(false);
    const [conceptKeywords, setConceptKeywords] = useState<Record<string, string[]>>(() => {
        // Initialize with existing keywords or empty arrays
        const initialKeywords: Record<string, string[]> = {};
        config.concepts.forEach(concept => {
            initialKeywords[concept] = config.concept_specified_config[concept]?.keyword_finder?.manual_keywords || [concept];
        });
        return initialKeywords;
    });

    // Updates domain in config
    const handleDomainNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTempConfig({
            ...tempConfig,
            domain: e.target.value
        });
    };

    // Updates concepts array and initializes keywords for new concepts
    const handleConceptsChange = (concepts: string[]) => {
        setTempConfig({
            ...tempConfig,
            concepts
        });
        // Update concept keywords for new concepts
        const newConceptKeywords: Record<string, string[]> = {};
        concepts.forEach(concept => {
            newConceptKeywords[concept] = conceptKeywords[concept] || [concept];
        });
        setConceptKeywords(newConceptKeywords);
    };

    // New function to handle editing (unlocking) after confirmation
    const handleEdit = () => {
        setIsConfirmed(false);
        setIsCollapsed(false);
        setTempConfig(config);
        setError(null);
    };

    // Handle canceling changes and returning to confirmed state
    const handleCancel = () => {
        setTempConfig(config);
        setIsConfirmed(true);
        setIsCollapsed(true);
        setError(null);
        setSelectedConcept(null);
        // Reset concept keywords to match the current config
        const resetKeywords: Record<string, string[]> = {};
        config.concepts.forEach(concept => {
            resetKeywords[concept] = config.concept_specified_config[concept]?.keyword_finder?.manual_keywords || [concept];
        });
        setConceptKeywords(resetKeywords);
        setShowKeywordFinder(config.shared_config.keyword_finder.require);
    };

    // Handle clicking on the collapsed header to expand
    const handleHeaderClick = () => {
        if (isConfirmed && isCollapsed) {
            setIsCollapsed(false);
        }
    };

    // Updates multiple config values when confirming changes:
    // - domain
    // - concepts
    // - shared_config.keyword_finder.require (only when AI assistant is enabled)
    // - concept_specified_config[concept].keyword_finder.manual_keywords
    // - shared_config.keyword_finder.method (only when AI assistant is enabled)
    const handleConfirm = () => {
        // Validate the configuration
        if (!tempConfig.domain.trim()) {
            setError('Topic name is required');
            return;
        }
        if (tempConfig.concepts.length === 0) {
            setError('At least one concept is required');
            return;
        }

        // Update concept-specific configs while preserving existing configurations
        const updatedConceptConfig = { ...tempConfig.concept_specified_config };
        Object.entries(conceptKeywords).forEach(([concept, keywords]) => {
            updatedConceptConfig[concept] = {
                ...updatedConceptConfig[concept], // Preserve existing config
                keyword_finder: {
                    ...updatedConceptConfig[concept]?.keyword_finder, // Preserve existing keyword finder config
                    manual_keywords: keywords
                }
            };
        });

        const updatedConfig = {
            ...tempConfig,
            concept_specified_config: updatedConceptConfig,
            shared_config: {
                ...tempConfig.shared_config,
                keyword_finder: {
                    ...tempConfig.shared_config.keyword_finder,
                    require: showKeywordFinder,
                    ...(showKeywordFinder ? {
                        method: tempConfig.shared_config.keyword_finder.method
                    } : {
                        method: 'embedding_on_wiki'  // Default method when not using AI assistant
                    })
                }
            }
        };

        onConfigChange(updatedConfig);
        setIsConfirmed(true);
        setIsCollapsed(true);
        setError(null);
        setSelectedConcept(null);
    };

    const handleConceptClick = (concept: string) => {
        setSelectedConcept(selectedConcept === concept ? null : concept);
    };

    // Updates keywords for a specific concept in conceptKeywords state
    const handleKeywordsChange = (keywords: string[]) => {
        if (selectedConcept) {
            setConceptKeywords(prev => ({
                ...prev,
                [selectedConcept]: keywords
            }));
        }
    };

    // Create title with confirmation status
    const getTitle = () => {
        if (isConfirmed) {
            return (
                <div className="flex items-center space-x-2">
                    <span>Domain Configuration</span>
                    <div className="flex items-center space-x-1 text-green-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Confirmed</span>
                    </div>
                </div>
            );
        }
        return "Set Up Your Topic";
    };

    const getDescription = () => {
        if (isConfirmed && isCollapsed) {
            return (
                <div className="space-y-1">
                    <p className="text-sm text-gray-600">Topic: <span className="font-medium">{config.domain}</span></p>
                    <p className="text-sm text-gray-600">Concepts: <span className="font-medium">{config.concepts.join(', ')}</span></p>
                </div>
            );
        }
        return "Define the main topic and related concepts you want to explore";
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
            <div className="space-y-8">
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        {error}
                    </Alert>
                )}

                {/* Input for domain */}
                <div className="space-y-4">
                    <div className="space-y-3">
                        <label className="text-base font-semibold text-gray-900 block">Topic Name</label>
                        <Input
                            value={isConfirmed ? config.domain : tempConfig.domain}
                            onChange={handleDomainNameChange}
                            placeholder="Enter your main topic"
                            required
                            disabled={isConfirmed}
                            className="w-full placeholder:text-gray-500"
                        />
                        <p className="text-sm text-gray-600">
                            The main subject or area you want to explore (e.g., 'Artificial Intelligence', 'Climate Change')
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Input for concepts array */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-base font-semibold text-gray-900">Key Concepts</label>
                            <p className="text-sm text-gray-600">
                                Add the main ideas or themes you want to explore within your topic. These will be used to generate relevant content and questions.
                            </p>
                        </div>
                        <ConceptList
                            concepts={isConfirmed ? config.concepts : tempConfig.concepts}
                            onChange={handleConceptsChange}
                            disabled={isConfirmed}
                            onConceptClick={handleConceptClick}
                            selectedConcept={selectedConcept}
                        />
                    </div>

                    {/* Input for concept-specific keywords */}
                    {selectedConcept && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                            <div className="space-y-3">
                                <label className="text-base font-semibold text-gray-900">Related Terms for "{selectedConcept}"</label>
                                <p className="text-sm text-gray-600">
                                    Add specific terms or phrases related to this concept. These will help generate more focused and relevant content.
                                </p>
                                <ConceptList
                                    concepts={conceptKeywords[selectedConcept] || []}
                                    onChange={handleKeywordsChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* Toggle for keyword finder and its configuration */}
                    <div className="pt-6 border-t border-gray-200">
                        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                            <div className="space-y-3">
                                <h3 className="text-base font-semibold text-gray-900">AI Assistance</h3>
                                <FormSwitch
                                    label="Use AI Keyword Assistant"
                                    checked={showKeywordFinder}
                                    onChange={(checked) => setShowKeywordFinder(checked)}
                                    description="Let AI help you discover relevant terms and phrases for your concepts. This can help expand your search and find more comprehensive content."
                                />
                            </div>

                            {showKeywordFinder && (
                                <div className="pt-4 border-t border-gray-200">
                                    <KeywordFinderConfig
                                        config={tempConfig}
                                        onConfigChange={setTempConfig}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                    {!isConfirmed ? (
                        <>
                            <Button onClick={handleCancel} variant="outline" className="px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-50">
                                Cancel
                            </Button>
                            <Button onClick={handleConfirm} variant="default" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white">
                                Confirm Settings
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleEdit} variant="outline" className="px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-50">
                            Edit Settings
                        </Button>
                    )}
                </div>
            </div>
        </FormCard>
    );
};

export default DomainConfig; 