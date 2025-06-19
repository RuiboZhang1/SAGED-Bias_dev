import React, { useState } from 'react';
import { Container, Typography } from '@mui/material';
import TestRunning from '../components/analysis/TestRunning';
import ModelConfig from '../components/analysis/ModelConfig';
import BenchmarkSelector from '../components/analysis/BenchmarkSelector';
import ExtractionConfig from '../components/analysis/ExtractionConfig';
import StatisticsConfig from '../components/analysis/StatisticsConfig';
import BenchmarkResults from '../components/analysis/BenchmarkResults';
import { AnalysisConfig, RunBenchmarkConfig, RunBenchmarkResponse } from '../types/saged_config';
import { Button } from '../components/ui/button';
import { API_ENDPOINTS } from '../config/api';

const Analysis: React.FC = () => {
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    specifications: ['concept'],
    analyzers: ['mean'],
    analyzer_configs: {},
    statistics_saving_location: 'data/customized/_sbgea_test_run_statistics.csv',
    disparity_saving_location: 'data/customized/_sbgea_test_run_disparity.csv'
  });

  const [selectedBenchmark, setSelectedBenchmark] = useState<any>(null);
  const [results, setResults] = useState<RunBenchmarkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelConfigs, setModelConfigs] = useState<Record<string, { model_name: string; system_prompt: string }>>({});

  const handleRunBenchmark = async () => {
    if (!selectedBenchmark) {
      setError('Please select a benchmark first');
      return;
    }

    if (Object.keys(modelConfigs).length === 0) {
      setError('Please configure at least one model');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config: RunBenchmarkConfig = {
        database_config: {
          use_database: true,
          database_type: "sqlite",
          database_connection: "",
          table_prefix: "saged_",
          source_text_table: "source_texts"
        },
        benchmark: selectedBenchmark,
        generation: {
          require: true,
          generate_dict: modelConfigs,
          generation_saving_location: 'data/customized/_sbg_test_run.csv',
          generation_list: Object.keys(modelConfigs),
          baseline: 'baseline'
        },
        extraction: {
          feature_extractors: ['sentiment_classification'],
          extractor_configs: {},
          calibration: true,
          extraction_saving_location: 'data/customized/_sbge_test_run.csv'
        },
        analysis: analysisConfig
      };

      const response = await fetch(API_ENDPOINTS.BENCHMARK.RUN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to run benchmark');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Model Analysis
      </Typography>
      <div className="space-y-4">
        <TestRunning />
        <ModelConfig onConfigChange={setModelConfigs} />
        <BenchmarkSelector onSelect={setSelectedBenchmark} />
        <ExtractionConfig />
        <StatisticsConfig
          config={analysisConfig}
          onConfigChange={setAnalysisConfig}
        />
        
        <div className="w-full">
          <Button 
            onClick={handleRunBenchmark}
            disabled={loading || !selectedBenchmark || Object.keys(modelConfigs).length === 0}
            className="w-full"
          >
            {loading ? 'Running...' : 'Run Benchmark'}
          </Button>
        </div>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <BenchmarkResults response={results} />
      </div>
    </Container>
  );
};

export default Analysis;
