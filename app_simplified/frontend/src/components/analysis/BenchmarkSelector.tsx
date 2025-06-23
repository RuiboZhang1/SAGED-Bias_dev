import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { BenchmarkMetadataResponse } from '../../types/benchmark';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button as UIButton } from '../ui/button';
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DataTable } from '../ui/data-table';
import { Label } from '../ui/label';
import { RefreshCw, Edit } from 'lucide-react';

interface BenchmarkSelectorProps {
    onSelect: (benchmark: any) => void;
}

const BenchmarkSelector: React.FC<BenchmarkSelectorProps> = ({ onSelect }) => {
    const [metadata, setMetadata] = useState<BenchmarkMetadataResponse | null>(null);
    const [selectedBenchmark, setSelectedBenchmark] = useState<string>('');
    const [confirmedBenchmark, setConfirmedBenchmark] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    useEffect(() => {
        fetchMetadata();
    }, []);

    // Set default benchmark when metadata is loaded
    useEffect(() => {
        if (metadata && !selectedBenchmark) {
            const firstTable = Object.keys(metadata)[0];
            if (firstTable && metadata[firstTable].length > 0) {
                setSelectedBenchmark(`${firstTable}-0`);
            }
        }
    }, [metadata]);

    const fetchMetadata = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(API_ENDPOINTS.METADATA.GET_ALL);
            if (!response.ok) throw new Error('Failed to fetch metadata');
            const data = await response.json();
            setMetadata(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleBenchmarkSelect = (value: string) => {
        setSelectedBenchmark(value);
        setConfirmedBenchmark(null); // Reset confirmed benchmark when selection changes
    };

    const handleConfirmBenchmark = () => {
        if (!selectedBenchmark || !metadata) {
            setError('Please select a benchmark first');
            return;
        }
        const [tableName, recordIndex] = selectedBenchmark.split('-');
        const record = metadata[tableName]?.[parseInt(recordIndex)];
        if (record?.data) {
            setConfirmedBenchmark(record.data);
            onSelect(record.data);
            setError('');
            // Collapse the section after confirmation
            setIsExpanded(false);
        }
    };

    const handleEditSelection = () => {
        setIsExpanded(true);
        setConfirmedBenchmark(null);
    };

    const getSelectedBenchmarkData = () => {
        if (!selectedBenchmark || !metadata) return null;
        const [tableName, recordIndex] = selectedBenchmark.split('-');
        return metadata[tableName]?.[parseInt(recordIndex)]?.data;
    };

    const getSelectedBenchmarkName = () => {
        if (!selectedBenchmark) return '';
        const [tableName, recordIndex] = selectedBenchmark.split('-');
        return `${tableName} - Record ${parseInt(recordIndex) + 1}`;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between w-full">
                    <div>
                        <CardTitle>Benchmark Selection</CardTitle>
                        <CardDescription>
                            {confirmedBenchmark && !isExpanded 
                                ? `Selected: ${getSelectedBenchmarkName()}`
                                : "Select a benchmark to analyze"
                            }
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                        <UIButton
                            variant="ghost"
                            size="sm"
                            onClick={fetchMetadata}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </UIButton>
                        {confirmedBenchmark && !isExpanded && (
                            <UIButton
                                variant="ghost"
                                size="sm"
                                onClick={handleEditSelection}
                                className="text-blue-600 hover:text-blue-700"
                            >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                            </UIButton>
                        )}
                        <UIButton
                            variant="ghost"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="ml-auto p-2 h-auto"
                        >
                            <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </UIButton>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Benchmark Selection Section - only show when expanded */}
                    {isExpanded && (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                            <div className="space-y-4">
                                <Label htmlFor="benchmark-select" className="text-base font-medium">Select Benchmark</Label>
                                <div className="space-y-3">
                                    <UISelect
                                        value={selectedBenchmark}
                                        onValueChange={handleBenchmarkSelect}
                                        className="w-full"
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {metadata && Object.entries(metadata).map(([tableName, records]) =>
                                                records.map((_, index) => (
                                                    <SelectItem key={`${tableName}-${index}`} value={`${tableName}-${index}`}>
                                                        {`${tableName} - Record ${index + 1}`}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </UISelect>
                                    
                                    {/* Confirmation message positioned right after dropdown */}
                                    {confirmedBenchmark && (
                                        <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-medium">
                                                Benchmark '{selectedBenchmark?.split('-')[0]}' confirmed
                                            </span>
                                        </div>
                                    )}
                                    
                                    <UIButton
                                        onClick={handleConfirmBenchmark}
                                        disabled={!selectedBenchmark}
                                        className={`w-full py-3 ${
                                            !selectedBenchmark 
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                        }`}
                                        size="lg"
                                    >
                                        Confirm
                                    </UIButton>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error message - only show when expanded */}
                    {isExpanded && error && (
                        <div className="text-red-600 text-sm p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Benchmark Preview Section - always show when there's a selected benchmark */}
                    {selectedBenchmark && (
                        <div className="space-y-4">
                            {/* Visual separator - only show when expanded */}
                            {isExpanded && <div className="border-t border-gray-200"></div>}
                            
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Benchmark Preview</h3>
                                <div className="bg-white border rounded-lg overflow-hidden">
                                    {getSelectedBenchmarkData() && (
                                        <DataTable data={getSelectedBenchmarkData() as Record<string, any>} />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default BenchmarkSelector; 