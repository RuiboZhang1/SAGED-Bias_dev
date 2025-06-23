import React, { useState, useEffect } from 'react';
import { Typography, Paper, CircularProgress } from '@mui/material';
import { API_ENDPOINTS } from '../../config/api';
import { ModelInfo, ModelsResponse, GenerationRequest, GenerationResponse } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button as UIButton } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Alert } from '../ui/alert';

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

  const clearResults = () => {
    setGeneratedText('');
    setError('');
  };

  const getTitle = () => {
    return (
      <div className="flex items-center justify-between w-full">
        <span>Model Testing Playground</span>
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
    );
  };

  const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="group relative inline-block ml-2">
      <svg className="w-4 h-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
        {text}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900">{getTitle()}</CardTitle>
        <CardDescription className="text-base text-gray-600">
          Test model generation with different prompts and compare model responses
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              {error}
            </Alert>
          )}

          {/* Model Selection Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Language Model Selection</h3>
                <InfoTooltip text="Choose which AI model to use for generating responses" />
              </div>
              <p className="text-sm text-gray-600">
                Select the AI model that will process your prompts and generate responses
              </p>
              <UISelect
                value={selectedModel}
                onValueChange={setSelectedModel}
                className="w-full"
              >
                <option value="" disabled>
                  Choose a language model...
                </option>
                {Object.entries(models).map(([name, info]) => (
                  <option key={name} value={name}>
                    {name} ({info.type} - {info.deployment_name})
                  </option>
                ))}
              </UISelect>
            </div>
          </div>

          {/* Prompt Configuration Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Prompt Configuration</h3>
              <p className="text-sm text-gray-600">
                Configure how the AI model should behave and what question you want to ask
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {/* System Prompt */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <Label htmlFor="systemPrompt" className="text-base font-medium text-gray-900">
                    System Prompt
                  </Label>
                  <InfoTooltip text="Sets the behavior, role, or personality of the AI model" />
                </div>
                <Textarea
                  id="systemPrompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={5}
                  placeholder="e.g., You are a helpful customer support agent who provides clear and friendly responses..."
                  className="resize-none border-green-300 focus:border-green-500 bg-white"
                />
              </div>

              {/* Input Text */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <Label htmlFor="inputText" className="text-base font-medium text-gray-900">
                    User Message
                  </Label>
                  <InfoTooltip text="The specific question or message you want the model to respond to" />
                </div>
                <Textarea
                  id="inputText"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={5}
                  placeholder="e.g., What are your return policies for electronics purchased online?"
                  className="resize-none border-gray-300 focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="flex flex-col items-center space-y-4 pt-4 border-t border-gray-200">
            <div className="flex space-x-4">
              <UIButton
                onClick={handleGenerate}
                disabled={loading || !selectedModel || !inputText}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} className="text-white" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    <span>Generate Response</span>
                  </>
                )}
              </UIButton>
              
              {generatedText && (
                <UIButton
                  onClick={clearResults}
                  variant="outline"
                  className="px-6 py-3 font-medium"
                >
                  Clear Results
                </UIButton>
              )}
            </div>

            {(!selectedModel || !inputText) && (
              <p className="text-sm text-gray-500 italic">
                Please select a model and enter your message to generate a response
              </p>
            )}
          </div>

          {/* Results Section */}
          {generatedText && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">Generated Response</h3>
                <div className="flex items-center space-x-1 text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Complete</span>
                </div>
              </div>
              <Paper className="p-6 bg-white border border-gray-300 shadow-sm">
                <Typography className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {generatedText}
                </Typography>
              </Paper>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Model: <span className="font-medium text-gray-700">{selectedModel}</span></span>
                <span>Response generated successfully</span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default TestRunning; 