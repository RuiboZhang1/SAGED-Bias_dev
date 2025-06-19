# SAGED Benchmark Building Flow

This document outlines the flow of building a benchmark in SAGED, from user input through the frontend to the backend services and finally to the SAGED pipeline.

## Overview

The benchmark building process involves several components working together:
1. Frontend form for user configuration
2. Backend services for processing and database management
3. SAGED pipeline for actual benchmark generation

## Frontend to Backend Flow

### 1. User Input Collection (Frontend)
- Users interact with the `BenchmarkConfigForm` component in `build_forms.tsx`
- The form collects:
  - Domain configuration (domain name, concepts, keywords)
  - Source configuration (source selection and settings)
  - Prompt assembly configuration (prompt generation and branching options)
- Form validation ensures all required fields are filled

### 2. API Request
- When the user submits the form, it sends a POST request to the backend endpoint
- The configuration is sent as JSON in the request body
- The frontend handles response states (success/error) and displays appropriate messages

## Backend Processing

### 1. SagedService Processing
The `SagedService` class handles the benchmark building process through several steps:

#### Database Setup
- Verifies database connection
- Activates the database for use
- Sets up table names for different components:
  - Keywords table
  - Source finder table
  - Scraped sentences table
  - Benchmark table
  - Replacement description table (if branching is enabled)

#### Configuration Processing
- Converts Pydantic model to dictionary
- Adds database configuration
- Updates saving locations to use database table names
- Handles branching configuration if enabled
- Sets up generation functions for:
  - Question generation
  - Replacement descriptor generation
  - Keyword finder LLM inquiries

### 2. Model and Database Services
- `ModelService`: Handles LLM model interactions and generation functions
- `DatabaseService`: Manages database operations and table management

## SAGED Pipeline Execution

### 1. Configuration Merging
- Merges concept-specific configurations with default configurations
- Updates domain benchmark configuration scheme
- Sets up database configuration

### 2. Benchmark Building Process
1. Creates initial domain benchmark with specified data tier
2. Iterates through concepts to build individual benchmarks
3. Merges concept benchmarks into domain benchmark
4. Handles branching if enabled:
   - Creates empty scraped sentences data
   - Applies branching configuration
   - Updates data tier

### 3. Data Storage
- Saves benchmark data to specified locations
- Stores metadata in database
- Handles cleanup after completion

## Error Handling

- Frontend handles API errors and displays user-friendly messages
- Backend implements comprehensive error handling:
  - Database connection errors
  - Configuration validation errors
  - Pipeline execution errors
- All errors are logged for debugging

## Response Flow

1. Pipeline returns benchmark results
2. Backend processes results and creates response object
3. Frontend receives and displays results
4. Database cleanup is performed

## Key Components

- **Frontend**: `build_forms.tsx` - User interface for configuration
- **Backend Services**:
  - `SagedService`: Main service orchestrating the process
  - `ModelService`: Handles LLM interactions
  - `DatabaseService`: Manages database operations
- **SAGED Pipeline**: Core functionality for benchmark generation 