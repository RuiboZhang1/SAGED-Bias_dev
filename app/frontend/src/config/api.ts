// API configuration
export const API_HOST = 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
    BENCHMARK: {
        BUILD: `${API_HOST}/benchmark/build`,
        RUN: `${API_HOST}/benchmark/run`
    },
    FILES: {
        // File upload and management
        UPLOAD: (domain: string) => `${API_HOST}/files/upload/${domain}`,
        LIST: (domain: string) => `${API_HOST}/files/${domain}`,
        PATHS: (domain: string) => `${API_HOST}/files/${domain}/paths`,
        CONTENT: (domain: string, filename: string) => `${API_HOST}/files/content/${domain}/${filename}`,
        DELETE: (domain: string, filename: string) => `${API_HOST}/files/${domain}/${filename}`,
        CLEANUP: (domain: string) => `${API_HOST}/files/${domain}`,
        
        // Table configuration
        GET_TABLE: `${API_HOST}/files/config/table`,
        UPDATE_TABLE: `${API_HOST}/files/config/table`,
        
        // Database source table configuration
        GET_DB_TABLE: `${API_HOST}/files/database/sourcetable`,
        UPDATE_DB_TABLE: `${API_HOST}/files/database/sourcetable`,
    },
    METADATA: {
        GET_ALL: `${API_HOST}/db/benchmark-metadata`,
    },
    MODEL: {
        GET_AVAILABLE: `${API_HOST}/api/model/available`,
        GENERATE: `${API_HOST}/api/model/generate`,
    },
} as const; 