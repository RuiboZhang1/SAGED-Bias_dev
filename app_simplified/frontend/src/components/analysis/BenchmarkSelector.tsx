import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { BenchmarkMetadataResponse } from '../../types/benchmark';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button as UIButton } from '../ui/button';
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DataTable } from '../ui/data-table';
import { Label } from '../ui/label';
import { RefreshCw } from 'lucide-react';

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
        }
    };

    const getSelectedBenchmarkData = () => {
        if (!selectedBenchmark || !metadata) return null;
        const [tableName, recordIndex] = selectedBenchmark.split('-');
        return metadata[tableName]?.[parseInt(recordIndex)]?.data;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Benchmark Selection</CardTitle>
                        <CardDescription>Select a benchmark to analyze</CardDescription>
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
                        <UIButton
                            variant="ghost"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? 'Collapse' : 'Expand'}
                        </UIButton>
                    </div>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="benchmark-select">Select Benchmark</Label>
                            <div className="flex gap-2">
                                <UISelect
                                    value={selectedBenchmark}
                                    onValueChange={handleBenchmarkSelect}
                                    className="flex-1"
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2 text-sm text-muted-foreground">Choose a benchmark...</div>
                                        {metadata && Object.entries(metadata).map(([tableName, records]) =>
                                            records.map((_, index) => (
                                                <SelectItem key={`${tableName}-${index}`} value={`${tableName}-${index}`}>
                                                    {`${tableName} - Record ${index + 1}`}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </UISelect>
                                <UIButton
                                    onClick={handleConfirmBenchmark}
                                    disabled={!selectedBenchmark}
                                >
                                    Confirm
                                </UIButton>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        {selectedBenchmark && (
                            <div className="mt-4">
                                <Label>Benchmark Preview</Label>
                                <div className="mt-2">
                                    {getSelectedBenchmarkData() && (
                                        <DataTable data={getSelectedBenchmarkData() as Record<string, any>} />
                                    )}
                                </div>
                                {confirmedBenchmark && (
                                    <div className="mt-2 text-green-500 text-sm">
                                        ✓ Benchmark confirmed
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default BenchmarkSelector; 