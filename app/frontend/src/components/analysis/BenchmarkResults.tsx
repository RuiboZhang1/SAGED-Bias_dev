import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { RunBenchmarkResponse } from '../../types/saged_config';
import { DataTable } from '../ui/data-table';

interface BenchmarkResultsProps {
    response: RunBenchmarkResponse | null;
}

// Generic function to transform any data into table format
const transformToTableData = (data: any): { columns: string[], data: Record<string, any>[] } => {
    if (!data) return { columns: [], data: [] };
    
    // If data is already an array, process each item
    if (Array.isArray(data)) {
        const transformedData = data.map(item => {
            const transformedItem: Record<string, any> = {};
            Object.entries(item).forEach(([key, value]) => {
                // Handle nested objects
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                        transformedItem[`${key}_${nestedKey}`] = formatValue(nestedValue);
                    });
                } else {
                    transformedItem[key] = formatValue(value);
                }
            });
            return transformedItem;
        });

        const columns = transformedData.length > 0 ? Object.keys(transformedData[0]) : [];
        return { columns, data: transformedData };
    }
    
    // If data is an object, convert to array of single item
    if (typeof data === 'object') {
        const transformedItem: Record<string, any> = {};
        Object.entries(data).forEach(([key, value]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                    transformedItem[`${key}_${nestedKey}`] = formatValue(nestedValue);
                });
            } else {
                transformedItem[key] = formatValue(value);
            }
        });

        const columns = Object.keys(transformedItem);
        return { columns, data: [transformedItem] };
    }
    
    return { columns: [], data: [] };
};

// Helper function to format values
const formatValue = (value: any): any => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return value.toFixed(4);
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
};

const BenchmarkResults: React.FC<BenchmarkResultsProps> = ({ response }) => {
    if (!response) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Benchmark Results</CardTitle>
                <CardDescription>
                    Status: {response.status}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {response.message && (
                        <div className="text-sm">
                            {response.message}
                        </div>
                    )}

                    {response.data && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Metadata</h3>
                                <div className="text-sm">
                                    <p>Domain: {response.data.domain}</p>
                                    <p>Timestamp: {response.data.time_stamp}</p>
                                </div>
                            </div>

                            {response.results && (
                                <div className="space-y-4">
                                    {response.results.generation && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Generation Results</h3>
                                            <DataTable data={transformToTableData(response.results.generation)} />
                                        </div>
                                    )}

                                    {response.results.extraction && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Extraction Results</h3>
                                            <DataTable data={transformToTableData(response.results.extraction)} />
                                        </div>
                                    )}

                                    {response.results.statistics && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Statistics Results</h3>
                                            {Object.entries(response.results.statistics).map(([analyzer, data]) => {
                                                const rawData = transformToTableData(data.raw);
                                                const calibratedData = transformToTableData(data.calibrated);
                                                
                                                return (
                                                    <div key={analyzer} className="mb-4">
                                                        <h4 className="font-medium mb-2">{analyzer}</h4>
                                                        {rawData.data.length > 0 && (
                                                            <div className="mb-2">
                                                                <h5 className="text-sm font-medium">Raw</h5>
                                                                <DataTable data={rawData} />
                                                            </div>
                                                        )}
                                                        {calibratedData.data.length > 0 && (
                                                            <div>
                                                                <h5 className="text-sm font-medium">Calibrated</h5>
                                                                <DataTable data={calibratedData} />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {response.results.disparity && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Disparity Results</h3>
                                            {response.results.disparity.raw && (
                                                <div className="mb-2">
                                                    <h4 className="font-medium">Raw</h4>
                                                    <DataTable data={transformToTableData(response.results.disparity.raw)} />
                                                </div>
                                            )}
                                            {response.results.disparity.calibrated && (
                                                <div>
                                                    <h4 className="font-medium">Calibrated</h4>
                                                    <DataTable data={transformToTableData(response.results.disparity.calibrated)} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default BenchmarkResults; 