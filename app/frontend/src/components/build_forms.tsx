import React, { useState } from 'react';
import { DomainBenchmarkConfig, BenchmarkResponse, defaultConfig } from '../types/saged_config';
import {
    Box,
    Button,
    Typography,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DomainConfig from './build_forms/DomainConfig';
import PromptAssemblerConfig from './build_forms/PromptAssemblerConfig';
import SourceSelection from './build_forms/SourceSelection';
import FormValidator from './build_forms/FormValidator';
import BenchmarkResults from './BenchmarkResults';
import { API_ENDPOINTS } from '../config/api';

const BenchmarkConfigForm: React.FC = () => {
    const [config, setConfig] = useState<DomainBenchmarkConfig>(defaultConfig);
    const [response, setResponse] = useState<BenchmarkResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showValidation, setShowValidation] = useState(false);

    const validateForm = (): boolean => {
        if (!config.domain.trim() || 
            config.concepts.length === 0 || 
            !config.shared_config.source_finder.require ||
            !config.shared_config.prompt_assembler.method) {
            setShowValidation(true);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        // Log what is being sent to the backend
        console.log('Sending data to backend:', {
            url: API_ENDPOINTS.BENCHMARK.BUILD,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: config
        });

        try {
            const response = await fetch(API_ENDPOINTS.BENCHMARK.BUILD, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                if (errorData?.detail) {
                    throw new Error(`Server error: ${errorData.detail}`);
                }
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Response from backend:', data);
            setResponse(data);
            setError(null);
        } catch (err) {
            console.error('Error sending configuration:', err);
            let errorMessage = 'An error occurred while connecting to the server.';
            
            if (err instanceof Error) {
                if (err.message.includes('Failed to fetch')) {
                    errorMessage = 'Unable to connect to the server. Please check if the backend service is running at http://localhost:8000.';
                } else if (err.message.includes('Server error:')) {
                    errorMessage = err.message;
                } else {
                    errorMessage = `Error: ${err.message}`;
                }
            }
            
            setError(errorMessage);
            setResponse(null);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Benchmark Builder
            </Typography>

            <div className="space-y-6">
                {/* Domain Configuration - Handles domain name, concepts, and keywords */}
                <Accordion defaultExpanded>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="domain-config-content"
                        id="domain-config-header"
                    >
                        <Typography variant="h6">Domain Configuration</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <DomainConfig 
                            config={config} 
                            onConfigChange={setConfig} 
                        />
                    </AccordionDetails>
                </Accordion>

                {/* Source Configuration - Handles source selection and settings */}
                <Accordion defaultExpanded>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="source-config-content"
                        id="source-config-header"
                    >
                        <Typography variant="h6">Source Configuration</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <SourceSelection
                            config={config}
                            onConfigChange={setConfig}
                        />
                    </AccordionDetails>
                </Accordion>

                {/* Prompt Assembly Configuration - Handles prompt generation and branching */}
                <Accordion defaultExpanded>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="prompt-config-content"
                        id="prompt-config-header"
                    >
                        <Typography variant="h6">Prompt Assembly Configuration</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <PromptAssemblerConfig 
                            config={config} 
                            onConfigChange={setConfig} 
                        />
                    </AccordionDetails>
                </Accordion>

                {/* Error and Response Messages */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {response && (
                    <Alert severity={response.status === 'success' ? 'success' : 'info'} sx={{ mb: 2 }}>
                        {response.message}
                    </Alert>
                )}

                {/* Submit Button */}
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                >
                    Build Benchmark
                </Button>

                {/* Display Results */}
                {response && <BenchmarkResults response={response} />}
            </div>

            {/* Form Validation Dialog */}
            <FormValidator
                config={config}
                open={showValidation}
                onClose={() => setShowValidation(false)}
                onConfigUpdate={setConfig}
            />
        </Box>
    );
};

export default BenchmarkConfigForm; 