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
    // Only notify parent of confirmed configurations
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
    const newConfig: ModelConfiguration = {
      id: Date.now().toString(),
      name: '',
      modelName: '',
      systemPrompt: 'You are a helpful assistant.',
      isExpanded: true,
    };
    setConfigs([...configs, newConfig]);
  };

  const removeConfig = (id: string) => {
    setConfigs(configs.filter(config => config.id !== id));
    // Remove from confirmed configs if it was confirmed
    const { [id]: removed, ...rest } = confirmedConfigs;
    setConfirmedConfigs(rest);
  };

  const updateConfig = (id: string, field: keyof ModelConfiguration, value: string | boolean) => {
    setConfigs(configs.map(config => 
      config.id === id ? { ...config, [field]: value } : config
    ));
    // Remove from confirmed configs when any field changes
    const { [id]: removed, ...rest } = confirmedConfigs;
    setConfirmedConfigs(rest);
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
      [id]: {
        model_name: config.modelName,
        system_prompt: config.systemPrompt
      }
    });
    setError('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Configuration</CardTitle>
        <CardDescription>Configure multiple models for analysis</CardDescription>
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
            {configs.map((config) => (
              <div key={config.id} className="border rounded-lg">
                <div className="p-4 flex justify-between items-center border-b">
                  <div className="flex items-center space-x-2">
                    <UIButton
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleConfig(config.id)}
                      className="p-0 h-6"
                    >
                      {config.isExpanded ? '▼' : '▶'}
                    </UIButton>
                    <Typography variant="h6">
                      {config.name || `Configuration ${configs.indexOf(config) + 1}`}
                    </Typography>
                    {confirmedConfigs[config.id] && (
                      <span className="text-green-500 text-sm">✓ Confirmed</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <UIButton
                      variant="secondary"
                      size="sm"
                      onClick={() => confirmConfig(config.id)}
                      disabled={!config.name || !config.modelName}
                    >
                      Confirm
                    </UIButton>
                    <UIButton
                      variant="secondary"
                      size="sm"
                      onClick={() => removeConfig(config.id)}
                    >
                      Remove
                    </UIButton>
                  </div>
                </div>
                {config.isExpanded && (
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${config.id}`}>Configuration Name</Label>
                      <Input
                        id={`name-${config.id}`}
                        value={config.name}
                        onChange={(e) => updateConfig(config.id, 'name', e.target.value)}
                        placeholder="Enter configuration name..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`model-${config.id}`}>Select Model</Label>
                      <UISelect
                        value={config.modelName}
                        onValueChange={(value) => updateConfig(config.id, 'modelName', value)}
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
                      <Label htmlFor={`prompt-${config.id}`}>System Prompt</Label>
                      <Textarea
                        id={`prompt-${config.id}`}
                        value={config.systemPrompt}
                        onChange={(e) => updateConfig(config.id, 'systemPrompt', e.target.value)}
                        rows={4}
                        placeholder="Enter system prompt..."
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <UIButton
              onClick={addConfig}
              className="w-full"
            >
              Add Model Configuration
            </UIButton>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ModelConfig; 