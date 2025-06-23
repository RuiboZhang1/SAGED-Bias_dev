import React from 'react';
import { BenchmarkResponse } from '../types/saged_config';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
} from '@mui/material';
import { DataTable } from './ui/data-table';

interface BenchmarkResultsProps {
    response: BenchmarkResponse;
}

const BenchmarkResults: React.FC<BenchmarkResultsProps> = ({ response }) => {
    const renderConfigTable = (data: any, title: string) => {
        if (!data || Object.keys(data).length === 0) return null;

        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    {title}
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Key</TableCell>
                                <TableCell>Value</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(data).map(([key, value]) => (
                                <TableRow key={key}>
                                    <TableCell>{key}</TableCell>
                                    <TableCell>
                                        {typeof value === 'object' 
                                            ? JSON.stringify(value, null, 2)
                                            : String(value)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                Benchmark Results
            </Typography>

            {/* Fixed header information */}
            {response.status && (
                <Typography variant="subtitle1" color="primary" gutterBottom>
                    Status: {response.status}
                </Typography>
            )}

            {response.message && (
                <Typography variant="body1" gutterBottom>
                    {response.message}
                </Typography>
            )}

            {response.data && (
                <>
                    {response.data.domain && (
                        <Typography variant="subtitle1" gutterBottom>
                            Domain: {response.data.domain}
                        </Typography>
                    )}
                    
                    {response.data.time_stamp && (
                        <Typography variant="subtitle2" gutterBottom>
                            Generated at: {response.data.time_stamp}
                        </Typography>
                    )}
                </>
            )}

            {/* Benchmark Data Section - Separate scrollable container */}
            {(response.data?.data || response.database_data) && (
                <>
                    <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                        Benchmark Data
                    </Typography>
                    <Paper 
                        elevation={2} 
                        sx={{ 
                            maxHeight: '700px', 
                            overflow: 'auto',
                            border: '1px solid #e0e0e0',
                            mb: 3
                        }}
                    >
                        <Box sx={{ p: 2 }}>
                            {response.data?.data && (
                                <Box sx={{ mb: 3 }}>
                                    <DataTable data={response.data.data} />
                                </Box>
                            )}

                            {response.database_data && (
                                <Box>
                                    {response.database_data.keywords && (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" gutterBottom sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1, pb: 1, fontWeight: 'bold' }}>
                                                Keywords
                                            </Typography>
                                            <DataTable data={response.database_data.keywords} />
                                        </Box>
                                    )}
                                    
                                    {response.database_data.source_finder && (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" gutterBottom sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1, pb: 1, fontWeight: 'bold' }}>
                                                Source Finder Results
                                            </Typography>
                                            <DataTable data={response.database_data.source_finder} />
                                        </Box>
                                    )}
                                    
                                    {response.database_data.scraped_sentences && (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" gutterBottom sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1, pb: 1, fontWeight: 'bold' }}>
                                                Scraped Sentences
                                            </Typography>
                                            <DataTable data={response.database_data.scraped_sentences} />
                                        </Box>
                                    )}
                                    
                                    {response.database_data.split_sentences && (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" gutterBottom sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1, pb: 1, fontWeight: 'bold' }}>
                                                Split Sentences
                                            </Typography>
                                            <DataTable data={response.database_data.split_sentences} />
                                        </Box>
                                    )}
                                    
                                    {response.database_data.questions && (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" gutterBottom sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1, pb: 1, fontWeight: 'bold' }}>
                                                Generated Questions
                                            </Typography>
                                            <DataTable data={response.database_data.questions} />
                                        </Box>
                                    )}
                                    
                                    {response.database_data.replacement_description && (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" gutterBottom sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1, pb: 1, fontWeight: 'bold' }}>
                                                Replacement Descriptions
                                            </Typography>
                                            <DataTable data={response.database_data.replacement_description} />
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </>
            )}

            {/* Configuration & Metadata Section - Separate scrollable container */}
            {(response.data?.configuration || response.data?.database_config || response.data?.table_names) && (
                <>
                    <Box sx={{ mb: 3 }}>
                        {response.data?.configuration && renderConfigTable(response.data.configuration, 'Configuration')}
                        
                        {response.data?.database_config && renderConfigTable(response.data.database_config, 'Database Configuration')}
                        
                        {response.data?.table_names && renderConfigTable(response.data.table_names, 'Table Names')}
                    </Box>
                </>
            )}
        </Box>
    );
};

export default BenchmarkResults; 