export interface ModelInfo {
  type: string;
  deployment_name: string;
}

export interface ModelsResponse {
  status: string;
  models: Record<string, ModelInfo>;
  message?: string;
}

export interface GenerationRequest {
  text: string;
  model_name?: string;
  system_prompt?: string;
}

export interface GenerationResponse {
  response: string;
}

export interface ModelConfiguration {
  id: string;
  name: string;
  modelName: string;
  systemPrompt: string;
  isExpanded: boolean;
}

export interface ModelConfigurationsResponse {
  status: string;
  configurations: ModelConfiguration[];
  message?: string;
} 