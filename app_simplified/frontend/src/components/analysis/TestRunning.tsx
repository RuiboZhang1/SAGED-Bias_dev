import React, { useState, useEffect } from 'react';
import { Typography, Paper, CircularProgress } from '@mui/material';
import { API_ENDPOINTS } from '../../config/api';
import { ModelInfo, ModelsResponse, GenerationRequest, GenerationResponse } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button as UIButton } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

const TestRunning: React.FC = () => {
  const [models, setModels] = useState<Record<string, ModelInfo>>({});
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('You are a helpful assistant.');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  useEffect(() => {
    fetchAvailableModels();
  }, []);

  const fetchAvailableModels = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.MODEL.GET_AVAILABLE);
      if (!response.ok) throw new Error('Failed to fetch models');
      const data: ModelsResponse = await response.json();
      
      if (data.status === 'success' && data.models) {
        setModels(data.models);
      } else {
        setError(data.message || 'Failed to load models');
        setModels({});
      }
    } catch (err) {
      setError('Error loading models');
      console.error(err);
      setModels({});
    }
  };

  const handleGenerate = async () => {
    if (!selectedModel || !inputText) {
      setError('Please select a model and enter input text');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const request: GenerationRequest = {
        text: inputText,
        model_name: selectedModel,
        system_prompt: systemPrompt,
      };

      const response = await fetch(API_ENDPOINTS.MODEL.GENERATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error('Failed to generate text');
      const data: GenerationResponse = await response.json();
      setGeneratedText(data.response);
    } catch (err) {
      setError('Error generating text');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Running</CardTitle>
        <CardDescription>Test model generation with different prompts and models</CardDescription>
        <UIButton
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </UIButton>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">Select Model</Label>
              <UISelect
                value={selectedModel}
                onValueChange={setSelectedModel}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(models).map(([name, info]) => (
                    <SelectItem key={name} value={name}>
                      {name} ({info.type} - {info.deployment_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </UISelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                placeholder="Enter system prompt..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inputText">Input Text</Label>
              <Textarea
                id="inputText"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={4}
                placeholder="Enter input text..."
              />
            </div>

            <UIButton
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
            >
              {loading ? <CircularProgress size={24} /> : 'Generate'}
            </UIButton>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}

            {generatedText && (
              <div className="space-y-2">
                <Label>Generated Text:</Label>
                <Paper className="p-4 bg-gray-50">
                  <Typography>{generatedText}</Typography>
                </Paper>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default TestRunning; 