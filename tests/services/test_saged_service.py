import pytest
import pandas as pd
from app_simplified.backend.services.saged_service import SagedService
from app_simplified.backend.schemas.run_config import RunBenchmarkConfig, GenerationConfig, ExtractionConfig, AnalysisConfig

@pytest.mark.asyncio
async def test_run_benchmark():
    """Test running a benchmark with an existing benchmark and test1 generation function"""
    # Initialize services
    saged_service = SagedService()
    
    # Get the existing benchmark from the database using the specific table name
    benchmark_data = saged_service.db_service.get_benchmark('nation', 'nation_benchmark_94a02254')
    assert benchmark_data is not None, "Benchmark data not found"
    
    # Create a random generation function configuration
    generation_functions = {
        'test1': {
            'model_name': 'qwen-turbo-latest',
            'system_prompt': 'You are a helpful and unbiased assistant.'
        },
    }
    


    # Create the run benchmark configuration
    config = RunBenchmarkConfig(
        benchmark=benchmark_data,
        generation=GenerationConfig(
            require=True,
            generate_dict=generation_functions,
            generation_saving_location='data/customized/_sbg_test_run.csv',
            generation_list=['test1'],
            baseline='baseline'
        ),
        extraction=ExtractionConfig(
            feature_extractors=[
                'sentiment_classification'
            ],
            calibration=True,
            extraction_saving_location='data/customized/_sbge_test_run.csv'
        ),
        analysis=AnalysisConfig(
            specifications=['concept'],
            analyzers=['mean', 'selection_rate'],
            statistics_saving_location='data/customized/_sbgea_test_run_statistics.csv',
            disparity_saving_location='data/customized/_sbgea_test_run_disparity.csv'
        )
    )
    
    # Run the benchmark
    response = await saged_service.run_benchmark('nation', config)
    
    # Verify the response
    assert response.status == "success", f"Benchmark run failed: {response.message}"
    assert response.data is not None, "No data in response"
    assert response.results is not None, "No results in response"
    
    # Verify the results structure
    assert 'generation' in response.results, "No generation results"
    assert 'extraction' in response.results, "No extraction results"
    assert 'statistics' in response.results, "No statistics results"
    assert 'disparity' in response.results, "No disparity results"
    
    # Verify the data types of results
    assert isinstance(response.results['generation'], pd.DataFrame), "Generation results not a DataFrame"
    assert isinstance(response.results['extraction'], pd.DataFrame), "Extraction results not a DataFrame"
    assert isinstance(response.results['statistics']['raw'], pd.DataFrame), "Raw statistics not a DataFrame"
    assert isinstance(response.results['statistics']['calibrated'], pd.DataFrame), "Calibrated statistics not a DataFrame"
    assert isinstance(response.results['disparity']['raw'], pd.DataFrame), "Raw disparity not a DataFrame"
    assert isinstance(response.results['disparity']['calibrated'], pd.DataFrame), "Calibrated disparity not a DataFrame"
    
    # Verify the metadata
    assert 'configuration' in response.data, "No configuration in metadata"
    assert 'table_names' in response.data, "No table names in metadata"
    assert 'time_stamp' in response.data, "No timestamp in metadata"
    
    # Verify the generation function was properly handled
    assert 'generation' in response.data['configuration'], "No generation config in metadata"
    assert 'generate_dict' in response.data['configuration']['generation'], "No generate_dict in metadata"
    assert 'test1' in response.data['configuration']['generation']['generate_dict'], "Selected generation function not in metadata"
    
    # Print some basic statistics for verification
    print(f"\nTest Results Summary:")
    print(f"Selected generation function: test1")
    print(f"Generation results shape: {response.results['generation'].shape}")
    print(f"Extraction results shape: {response.results['extraction'].shape}")
    print(f"Statistics results shape: {response.results['statistics']['raw'].shape}")
    print(f"Disparity results shape: {response.results['disparity']['raw'].shape}") 