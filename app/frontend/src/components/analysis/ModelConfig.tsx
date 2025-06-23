import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { API_ENDPOINTS } from '../../config/api';
import { ModelInfo, ModelsResponse, ModelConfiguration } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button as UIButton } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { SectionHeader } from '../ui/section-header';
import { Tooltip } from '@mui/material';

interface ModelConfigProps {
    onConfigChange: (configs: Record<string, { model_name: string; system_prompt: string }>) => void;
}

const ModelConfig: React.FC<ModelConfigProps> = ({ onConfigChange }) => {
  const [models, setModels] = useState<Record<string, ModelInfo>>({});
  const [configs, setConfigs] = useState<ModelConfiguration[]>([]);
  const [confirmedConfigs, setConfirmedConfigs] = useState<Record<string, { model_name: string; system_prompt: string }>>({});
  const [error, setError] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  useEffect(() => {
    fetchAvailableModels();
  }, []);

  useEffect(() => {
    onConfigChange(confirmedConfigs);
  }, [confirmedConfigs, onConfigChange]);

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

  const addConfig = () => {
    const configNumber = configs.length + 1;
    const defaultName = `Model Configuration ${configNumber}`;
    const firstModelName = Object.keys(models)[0] || '';
    const newConfig: ModelConfiguration = {
      id: Date.now().toString(),
      name: defaultName,
      modelName: firstModelName,
      systemPrompt: 'You are a helpful assistant.',
      isExpanded: true,
    };
    setConfigs([...configs, newConfig]);
  };

  const removeConfig = (id: string) => {
    const configToRemove = configs.find(config => config.id === id);
    setConfigs(configs.filter(config => config.id !== id));
    if (configToRemove) {
      const { [configToRemove.name]: removed, ...rest } = confirmedConfigs;
      setConfirmedConfigs(rest);
    }
  };

  const updateConfig = (id: string, field: keyof ModelConfiguration, value: string | boolean) => {
    const oldConfig = configs.find(config => config.id === id);
    setConfigs(configs.map(config => 
      config.id === id ? { ...config, [field]: value } : config
    ));
    // Remove from confirmed configs when editing
    if (field !== 'isExpanded' && oldConfig) {
      const { [oldConfig.name]: removed, ...rest } = confirmedConfigs;
      setConfirmedConfigs(rest);
    }
  };

  const toggleConfig = (id: string) => {
    setConfigs(configs.map(config =>
      config.id === id ? { ...config, isExpanded: !config.isExpanded } : config
    ));
  };

  const confirmConfig = (id: string) => {
    const config = configs.find(c => c.id === id);
    if (!config) return;

    if (!config.name || !config.modelName) {
      setError('Please fill in all required fields');
      return;
    }

    setConfirmedConfigs({
      ...confirmedConfigs,
      [config.name]: {  // Use config.name as key instead of id
        model_name: config.modelName,
        system_prompt: config.systemPrompt
      }
    });

    // Collapse the configuration after confirming
    setConfigs(configs.map(c =>
      c.id === id ? { ...c, isExpanded: false } : c
    ));
    
    setError('');
  };

  const editConfig = (id: string) => {
    setConfigs(configs.map(config =>
      config.id === id ? { ...config, isExpanded: true } : config
    ));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Model Configuration</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Configure multiple models for analysis. Each configuration will be used to run your benchmarks.
            </CardDescription>
          </div>
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
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-6">
            {/* Configuration Count Summary */}
            {configs.length > 0 && (
              <div className="text-sm text-gray-600 mb-4">
                {configs.length} configuration{configs.length !== 1 ? 's' : ''} created • {Object.keys(confirmedConfigs).length} confirmed
              </div>
            )}

            {configs.map((config, index) => {
              const isConfirmed = confirmedConfigs[config.name];
              const displayName = config.name || `Model Configuration ${index + 1}`;
              
              return (
                <div key={config.id} className="border rounded-lg shadow-sm bg-white">
                  <div className="p-4 flex justify-between items-center border-b bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <UIButton
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleConfig(config.id)}
                        className="p-0 h-6 w-6 hover:bg-gray-100 flex items-center justify-center"
                      >
                        {config.isExpanded ? '▼' : '▶'}
                      </UIButton>
                      <div>
                        <Typography variant="h6" className="font-semibold text-gray-900">
                          {displayName}
                        </Typography>
                        {isConfirmed && (
                          <Typography variant="body2" className="text-gray-600 text-sm">
                            {config.modelName} • System prompt configured
                          </Typography>
                        )}
                      </div>
                      {isConfirmed && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">Confirmed</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isConfirmed && !config.isExpanded ? (
                        <UIButton
                          variant="outline"
                          size="sm"
                          onClick={() => editConfig(config.id)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          Edit
                        </UIButton>
                      ) : (
                        <UIButton
                          variant="default"
                          size="sm"
                          onClick={() => confirmConfig(config.id)}
                          disabled={!config.name || !config.modelName}
                          className={`${
                            !config.name || !config.modelName 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                          }`}
                        >
                          {isConfirmed ? 'Update' : 'Confirm'}
                        </UIButton>
                      )}
                      <UIButton
                        variant="outline"
                        size="sm"
                        onClick={() => removeConfig(config.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        Remove
                      </UIButton>
                    </div>
                  </div>
                  {config.isExpanded && (
                    <div className="p-6 space-y-8">
                      {/* Configuration Name Section */}
                      <div className="space-y-4">
                        <SectionHeader
                          stepNumber={1}
                          title="Configuration Name"
                          description="Give this configuration a unique name to identify it"
                        />
                        <div className="pl-11">
                          <Input
                            id={`name-${config.id}`}
                            value={config.name}
                            onChange={(e) => updateConfig(config.id, 'name', e.target.value)}
                            placeholder="e.g., GPT-4 Analysis, Claude Comparison..."
                            className="max-w-md"
                          />
                        </div>
                      </div>

                      {/* Visual Separator */}
                      <div className="border-t border-gray-100"></div>

                      {/* Model Selection Section */}
                      <div className="space-y-4">
                        <SectionHeader
                          stepNumber={2}
                          title="Select Model"
                          description="Choose the model that will be used for this configuration"
                        />
                        <div className="pl-11">
                          <div className="max-w-md">
                            <UISelect
                              value={config.modelName}
                              onValueChange={(value) => updateConfig(config.id, 'modelName', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue>
                                  {config.modelName ? (
                                    <div className="flex flex-col text-left">
                                      <span className="font-medium">
                                        {models[config.modelName]?.deployment_name || config.modelName}
                                      </span>
                                      {models[config.modelName] && (
                                        <span className="text-xs text-gray-500">
                                          {models[config.modelName].type}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    "Choose a model..."
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(models).map(([name, info]) => (
                                  <SelectItem key={name} value={name} className="cursor-pointer">
                                    <div className="flex flex-col">
                                      <span className="text-xs text-gray-500">
                                        {info.deployment_name}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </UISelect>
                          </div>
                        </div>
                      </div>

                      {/* Visual Separator */}
                      <div className="border-t border-gray-100"></div>

                      {/* System Prompt Section */}
                      <div className="space-y-4">
                        <SectionHeader
                          stepNumber={3}
                          title="System Prompt"
                          description="Define how the model should behave and respond"
                        />
                        <div className="pl-11">
                          <Textarea
                            id={`prompt-${config.id}`}
                            value={config.systemPrompt}
                            onChange={(e) => updateConfig(config.id, 'systemPrompt', e.target.value)}
                            rows={4}
                            placeholder="You are a helpful assistant that..."
                            className="max-w-2xl"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Configuration Button */}
            <div className="pt-6">
              <UIButton
                onClick={addConfig}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm border-0"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Model Configuration
              </UIButton>
            </div>

            {error && (
              <div className="text-red-600 text-sm p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ModelConfig; 