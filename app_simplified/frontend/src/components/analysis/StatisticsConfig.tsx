import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AnalysisConfig } from '../../types/saged_config';

interface StatisticsConfigProps {
    config: AnalysisConfig;
    onConfigChange: (config: AnalysisConfig) => void;
}

const StatisticsConfig: React.FC<StatisticsConfigProps> = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Statistics Configuration</CardTitle>
                <CardDescription>Configure analysis settings</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Specification</Label>
                        <Select defaultValue="concept" disabled>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="concept">
                                    Concept
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Analyzer</Label>
                        <Select defaultValue="mean" disabled>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mean">
                                    Mean
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default StatisticsConfig; 