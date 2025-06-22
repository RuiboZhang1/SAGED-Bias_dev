import React, { useState, useEffect } from 'react';
import { DomainBenchmarkConfig } from '../../types/saged_config';
import { FormSwitch } from '../ui/form-switch';
import { KeywordReplacementPair } from './KeywordReplacementPair';
import { Button } from '../ui/button';
import { Select } from '../ui/select';

interface ConceptPair {
    root: string;
    branch: string;
    keywordReplacements: Array<{ original: string; replacement: string }>;
}

interface PromptAssemblerBranchingProps {
    config: DomainBenchmarkConfig;
    onConfigChange: (config: DomainBenchmarkConfig) => void;
}

const PromptAssemblerBranching: React.FC<PromptAssemblerBranchingProps> = ({ config, onConfigChange }) => {
    // Initialize from config's branching.replacement_descriptor_require
    const [useKeywordHelper, setUseKeywordHelper] = useState<boolean>(
        config.branching_config?.replacement_descriptor_require || false
    );

    // Concept pair management
    const [selectedRoot, setSelectedRoot] = useState<string>('');
    const [branchConcept, setBranchConcept] = useState<string>('');
    const [conceptPairs, setConceptPairs] = useState<ConceptPair[]>([]);
    const [selectedPairIndex, setSelectedPairIndex] = useState<number | null>(null);

    // Adds a new concept pair to the configuration
    const handleAddPair = () => {
        if (selectedRoot && branchConcept) {
            const newPair: ConceptPair = {
                root: selectedRoot,
                branch: branchConcept,
                keywordReplacements: [{
                    original: selectedRoot,
                    replacement: branchConcept
                }]
            };
            setConceptPairs(prev => [...prev, newPair]);
            setBranchConcept('');
        }
    };

    // Removes a concept pair from the configuration
    const handleRemovePair = (index: number) => {
        setConceptPairs(prev => prev.filter((_, i) => i !== index));
        if (selectedPairIndex === index) {
            setSelectedPairIndex(null);
        }
    };

    // Updates keyword replacements for a specific concept pair
    const handleKeywordPairsChange = (index: number, keywordPairs: Array<{ original: string; replacement: string }>) => {
        setConceptPairs(prev => {
            const newPairs = [...prev];
            newPairs[index] = {
                ...newPairs[index],
                keywordReplacements: keywordPairs
            };
            return newPairs;
        });
    };

    // Updates the keyword helper setting
    const handleKeywordHelperChange = (checked: boolean) => {
        setUseKeywordHelper(checked);
    };

    // Updates the selected root concept in local state
    const handleRootConceptChange = (value: string) => {
        setSelectedRoot(value);
    };

    // Updates branching_config whenever keyword helper or pairs change
    useEffect(() => {
        // Create nested dictionary structure
        const replacementDescription = conceptPairs.reduce((acc, pair) => {
            if (!acc[pair.root]) {
                acc[pair.root] = {};
            }
            acc[pair.root][pair.branch] = Object.fromEntries(
                pair.keywordReplacements.map(kr => [kr.original, kr.replacement])
            );
            return acc;
        }, {} as Record<string, Record<string, Record<string, string>>>);

        onConfigChange({
            ...config,
            branching: true,
            branching_config: {
                branching_pairs: "not_all",
                direction: "forward",
                replacement_descriptor_require: useKeywordHelper,
                descriptor_threshold: "Auto",
                descriptor_embedding_model: "paraphrase-Mpnet-base-v2",
                descriptor_distance: "cosine",
                replacement_description: replacementDescription,
                replacement_description_saving: true,
                replacement_description_saving_location: "default",
                counterfactual_baseline: true
            }
        });
    }, [useKeywordHelper, conceptPairs]);

    return (
        <div className="space-y-8">
            {/* Root and Branch concept selection UI */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Create Term Pairs</h4>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Stem Term</label>
                            <p className="text-xs text-gray-600 mb-2">
                                Select the main term that will be used as the base for generating variations.
                            </p>
                            <Select
                                value={selectedRoot}
                                onValueChange={handleRootConceptChange}
                            >
                                <option value="">Select stem term</option>
                                {config.concepts.map((concept) => (
                                    <option key={concept} value={concept}>
                                        {concept}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Branch Term</label>
                            <p className="text-xs text-gray-600 mb-2">
                                Enter a related term that will replace the stem term in variations.
                            </p>
                            <input
                                type="text"
                                value={branchConcept}
                                onChange={(e) => setBranchConcept(e.target.value)}
                                placeholder="Enter branch term"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-center pt-2">
                        <Button
                            onClick={handleAddPair}
                            disabled={!selectedRoot || !branchConcept}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <span className="text-lg">+</span>
                            Add Pair
                        </Button>
                    </div>
                </div>
            </div>

            {/* Concept pairs list and management UI */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <h4 className="text-base font-semibold text-gray-900">Term Pairs</h4>
                    <p className="text-xs text-gray-600">
                        View and manage your term pairs. Each pair represents a relationship that will be used to generate prompt variations.
                    </p>
                </div>
                
                <div className="space-y-3">
                    {conceptPairs.map((pair, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-md">
                                <span className="flex-1 text-sm">
                                    <span className="font-medium text-gray-900">{pair.root}</span>
                                    <span className="mx-2 text-gray-400">→</span>
                                    <span className="text-gray-700">{pair.branch}</span>
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setSelectedPairIndex(selectedPairIndex === index ? null : index)}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                    >
                                        {selectedPairIndex === index ? 'Hide Keywords' : 'Show Keywords'}
                                    </Button>
                                    <Button
                                        onClick={() => handleRemovePair(index)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Keyword replacements UI for selected pair */}
                            {selectedPairIndex === index && (
                                <div className="ml-4 pl-4 border-l-2 border-gray-200 bg-gray-50 rounded-r-md p-4">
                                    <p className="text-xs text-gray-600 mb-3">
                                        Configure specific keyword replacements between terms. This helps maintain context and meaning when generating variations.
                                    </p>
                                    <KeywordReplacementPair
                                        pairs={pair.keywordReplacements || []}
                                        onPairsChange={(pairs) => handleKeywordPairsChange(index, pairs)}
                                        stemConcept={pair.root}
                                        branchConcept={pair.branch}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                    {conceptPairs.length === 0 && (
                        <div className="text-xs text-gray-500 italic p-4 bg-gray-50 rounded-md text-center">
                            No term pairs added yet. Add pairs above to start generating prompt variations.
                        </div>
                    )}
                </div>
            </div>

            {/* Keyword helper toggle UI */}
            <div className="pt-6 border-t border-gray-200">
                <div className="space-y-2">
                    <h4 className="text-base font-semibold text-gray-900">AI Assistant</h4>
                    <FormSwitch
                        label="Enable Keyword Helper"
                        checked={useKeywordHelper}
                        onChange={handleKeywordHelperChange}
                        description="Enable AI assistance for suggesting keyword replacements. This helps identify related terms and maintain context when generating variations."
                    />
                </div>
            </div>
        </div>
    );
};

export default PromptAssemblerBranching; 