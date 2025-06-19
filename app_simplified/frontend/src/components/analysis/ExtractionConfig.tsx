import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const ExtractionConfig: React.FC = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Extraction Configuration</CardTitle>
                <CardDescription>Configure feature extraction settings</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Feature Extractor</Label>
                        <Select defaultValue="sentiment_classification" disabled>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sentiment_classification">
                                    Sentiment Classification
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="text-sm text-muted-foreground">
                            Currently only sentiment classification is supported
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ExtractionConfig; 