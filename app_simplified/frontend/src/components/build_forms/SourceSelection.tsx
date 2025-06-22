import React, { useState } from 'react';
import { DomainBenchmarkConfig } from '../../types/saged_config';
import { FormCard } from '../ui/form-card';
import { Button } from '../ui/button';
import { FormSwitch } from '../ui/form-switch';
import SourceFinderConfig from './SourceFinderConfig';
import FileUploadList from '../ui/file-upload-list';
import { ConceptSelector } from '../ui/concept-selector';
import axios from 'axios';
import { Alert } from '../ui/alert';
import { API_ENDPOINTS } from '../../config/api';

interface SourceSelectionProps {
    config: DomainBenchmarkConfig;
    onConfigChange: (config: DomainBenchmarkConfig) => void;
}

interface SourceWithConcepts {
    file: File;
    concepts: string[];
    uploadedPath?: string;
}

const SourceSelection: React.FC<SourceSelectionProps> = ({ config, onConfigChange }) => {
    // Local state for managing uploaded sources and their concept assignments
    const [sources, setSources] = useState<SourceWithConcepts[]>([]);
    // Local state to control Wikipedia source finder visibility
    const [showSourceFinder, setShowSourceFinder] = useState(
        config.shared_config.source_finder.method === 'wiki'
    );
    // Local state to track which source is being edited
    const [selectedSource, setSelectedSource] = useState<number | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // Confirmation and collapse state
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Handles new file uploads, uploading them to the backend
    const handleFilesChange = async (files: File[]) => {
        setIsUploading(true);
        setUploadError(null);
        
        // Check if domain is properly configured before proceeding
        if (!config.domain || config.domain.trim() === '') {
            setUploadError('Please confirm the Domain Configuration section first before uploading files.');
            setIsUploading(false);
            return;
        }
        
        try {
            // First, delete any removed files from the database
            // Find files to delete (in current sources but not in new files)
            const filesToDelete = sources.filter(source => 
                source.uploadedPath && !files.some(f => f.name === source.file.name)
            );

            // Delete removed files from database
            if (filesToDelete.length > 0) {
                setIsDeleting(true);
                try {
                    await Promise.all(filesToDelete.map(async (source) => {
                        if (source.uploadedPath) {
                            // Extract filename from the full path (remove domain prefix)
                            // uploadedPath format: "domain/timestamp_filename.txt"
                            const filename = source.uploadedPath.split('/').pop() || source.uploadedPath;
                            await axios.delete(
                                API_ENDPOINTS.FILES.DELETE(config.domain, filename)
                            );
                        }
                    }));
                } catch (error) {
                    console.error('Error deleting files:', error);
                    if (axios.isAxiosError(error) && error.response?.status === 404) {
                        setUploadError('Some files could not be deleted as they were not found in the database. This may happen if files were already removed or the database was reset.');
                    } else {
                        setUploadError('Failed to delete some files. Please try again.');
                    }
                    return;
                } finally {
                    setIsDeleting(false);
                }
            }

            // Upload new files
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await axios.post(
                    API_ENDPOINTS.FILES.UPLOAD(config.domain),
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
                
                return {
                    file,
                    concepts: [...config.concepts],
                    uploadedPath: response.data.data.path
                };
            });

            const uploadedSources = await Promise.all(uploadPromises);
            setSources(uploadedSources);

            // Update config with new sources
            updateSourceConfig(showSourceFinder);
        } catch (error) {
            console.error('Error handling files:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400 && error.response?.data?.detail?.includes('Only .txt files are allowed')) {
                    setUploadError('Only .txt files are allowed. Please select text files only.');
                } else if (error.response?.status === 500 && error.response?.data?.detail?.includes('domain')) {
                    setUploadError('Please confirm the Domain Configuration section first before uploading files.');
                } else {
                    setUploadError('Failed to upload files. Please check if the backend server is running and try again.');
                }
            } else {
                setUploadError('Failed to handle files. Please check if the backend server is running and try again.');
            }
        } finally {
            setIsUploading(false);
        }
    };

    // Toggles the selected source for editing
    const handleSourceClick = (index: number) => {
        setSelectedSource(selectedSource === index ? null : index);
    };

    // Updates the concepts assigned to a specific source
    const handleSourceConceptsChange = (index: number, concepts: string[]) => {
        setSources(prev => prev.map((source, i) => 
            i === index ? { ...source, concepts } : source
        ));
        // Update config when concepts change
        updateSourceConfig(showSourceFinder);
    };

    // Updates shared_config.source_finder and concept_specified_config with local files or Wikipedia settings
    const updateSourceConfig = (useWikipedia: boolean) => {
        // Create concept-specific source configurations
        const updatedConceptConfig = { ...config.concept_specified_config };
        
        // Group sources by concept
        const conceptSources: Record<string, string[]> = {};
        sources.forEach(source => {
            source.concepts.forEach(concept => {
                if (!conceptSources[concept]) {
                    conceptSources[concept] = [];
                }
                if (source.uploadedPath) {
                    conceptSources[concept].push(source.uploadedPath);
                }
            });
        });

        // Update concept-specific configs only for concepts that have sources
        Object.entries(conceptSources).forEach(([concept, paths]) => {
            // Only update if we have paths for this concept
            if (paths.length > 0) {
                updatedConceptConfig[concept] = {
                    ...updatedConceptConfig[concept], // Preserve existing config
                    source_finder: {
                        ...updatedConceptConfig[concept]?.source_finder, // Preserve existing source finder config
                        manual_sources: paths
                    }
                };
            }
        });

        const method = useWikipedia ? 'wiki' : 'local_files';
        const updatedConfig = {
            ...config,
            concept_specified_config: updatedConceptConfig,
            shared_config: {
                ...config.shared_config,
                source_finder: {
                    ...config.shared_config.source_finder,
                    require: true,
                    method
                },
                scraper: {
                    ...config.shared_config.scraper,
                    method // Sync scraper method with source finder method
                }
            }
        };

        onConfigChange(updatedConfig);
    };

    // Handles Wikipedia toggle
    const handleWikipediaToggle = (checked: boolean) => {
        setShowSourceFinder(checked);
        updateSourceConfig(checked);
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

    // Updates shared_config.source_finder with local files or Wikipedia settings
    const handleConfirm = () => {
        updateSourceConfig(showSourceFinder);
        setIsConfirmed(true);
        setIsCollapsed(true);
        setSelectedSource(null);
    };

    // Create title with confirmation status
    const getTitle = () => {
        if (isConfirmed) {
            return (
                <div className="flex items-center space-x-2">
                    <span>Source Configuration</span>
                    <div className="flex items-center space-x-1 text-green-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Confirmed</span>
                    </div>
                </div>
            );
        }
        return "Source Selection";
    };

    const getDescription = () => {
        if (isConfirmed && isCollapsed) {
            if (showSourceFinder) {
                // Show Wikipedia configuration details
                const forwardLinks = config.shared_config.source_finder.scrape_number || 0;
                const backwardLinks = config.shared_config.source_finder.scrape_backlinks || 0;
                return (
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">Source Type: <span className="font-medium">Wikipedia</span></p>
                        <div className="flex items-center space-x-4">
                            <p className="text-sm text-gray-600">Forward Links: <span className="font-medium">{forwardLinks}</span></p>
                            <p className="text-sm text-gray-600">Backward Links: <span className="font-medium">{backwardLinks}</span></p>
                        </div>
                    </div>
                );
            } else {
                // Show local files information
                return (
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">Source Type: <span className="font-medium">{sources.length} uploaded file(s)</span></p>
                        {sources.length > 0 && (
                            <p className="text-sm text-gray-600">Files: <span className="font-medium">{sources.map(s => s.file.name).join(', ')}</span></p>
                        )}
                    </div>
                );
            }
        }
        return "Upload sources and assign them to concepts";
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
            <div className="space-y-4">
                {/* File upload section - only shown when not using Wikipedia and not confirmed */}
                {!showSourceFinder && !isConfirmed && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Upload Sources</label>
                        <FileUploadList
                            files={sources.map(s => s.file)}
                            onFilesChange={handleFilesChange}
                            disabled={showSourceFinder || isUploading || isConfirmed}
                            label="Upload Source Files"
                            emptyMessage="No source files uploaded. Click 'Upload Source Files' to add sources."
                            accept=".txt"
                        />
                        {isUploading && (
                            <div className="text-sm text-gray-500">
                                Uploading files...
                            </div>
                        )}
                        {uploadError && (
                            <Alert variant="destructive" className="mt-2">
                                {uploadError}
                            </Alert>
                        )}
                    </div>
                )}

                {/* Concept assignment section - only shown when files are uploaded and not confirmed */}
                {sources.length > 0 && !showSourceFinder && !isConfirmed && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Assign Concepts to Sources</h3>
                        <div className="space-y-2">
                            {sources.map((source, index) => (
                                <div 
                                    key={source.file.name}
                                    className="p-4 border rounded-md hover:bg-gray-50"
                                >
                                    <div 
                                        className="font-medium mb-2 cursor-pointer"
                                        onClick={() => handleSourceClick(index)}
                                    >
                                        {source.file.name}
                                    </div>
                                    {selectedSource === index && (
                                        <div className="pl-4 space-y-2 border-l-2 border-border">
                                            <label className="text-sm text-gray-600">Assigned Concepts</label>
                                            <ConceptSelector
                                                selectedConcepts={source.concepts}
                                                availableConcepts={config.concepts}
                                                onChange={(concepts) => handleSourceConceptsChange(index, concepts)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Wikipedia source finder toggle and configuration - only shown when not confirmed */}
                {!isConfirmed && (
                    <div className="space-y-6 pt-6 border-t-2 border-gray-200">
                        <FormSwitch
                            label="Use Wikipedia"
                            description="Automatically discover and gather related Wikipedia articles for comprehensive research"
                            checked={showSourceFinder}
                            onChange={handleWikipediaToggle}
                            activeText="Wikipedia Enabled"
                            inactiveText="Wikipedia Disabled"
                        />

                        {/* Wikipedia source finder configuration - only shown when enabled */}
                        {showSourceFinder && (
                            <div className="ml-4 pl-6 space-y-4 border-l-4 border-purple-300 bg-purple-50/20 rounded-r-lg pr-4 py-4">
                                <SourceFinderConfig
                                    config={config}
                                    onConfigChange={onConfigChange}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Confirmation button to update the configuration */}
                <div className="flex flex-col items-end pt-6 border-gray-200 space-y-2">
                    {!isConfirmed ? (
                        <>
                            {!showSourceFinder && sources.length === 0 && (
                                <p className="text-sm text-gray-500 italic">
                                    Please either enable Wikipedia or upload files to continue
                                </p>
                            )}
                            <Button
                                onClick={handleConfirm}
                                variant="primary"
                                size="lg"
                                className="px-8 py-3 font-semibold shadow-lg"
                                disabled={!showSourceFinder && sources.length === 0}
                            >
                                Confirm Sources
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleEdit}
                            variant="outline"
                            className="px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
                        >
                            Edit Sources
                        </Button>
                    )}
                </div>
            </div>
        </FormCard>
    );
};

export default SourceSelection; 