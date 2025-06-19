import asyncio
import pandas as pd
from app_simplified.backend.services.saged_service import SagedService
from app_simplified.backend.schemas.run_config import RunBenchmarkConfig, GenerationConfig, ExtractionConfig, AnalysisConfig

async def run_manual_benchmark():
    """Manual test for running a benchmark with an existing benchmark and test1 generation function"""
    print("Initializing SagedService...")
    saged_service = SagedService()
    
    print("\nRetrieving benchmark data...")
    benchmark_data = saged_service.db_service.get_benchmark('nation', 'nation_benchmark_94a02254')
    if benchmark_data is None:
        print("Error: Benchmark data not found!")
        return
    print("Benchmark data retrieved successfully")
    
    print("\nSetting up generation function...")
    generation_functions = {
        'test1': {
            'model_name': 'qwen-turbo-latest',
            'system_prompt': 'You are a helpful and unbiased assistant.'
        },
    }
    
    print("\nCreating benchmark configuration...")
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
            analyzers=['mean'],
            statistics_saving_location='data/customized/_sbgea_test_run_statistics.csv',
            disparity_saving_location='data/customized/_sbgea_test_run_disparity.csv'
        )
    )
    
    print("\nRunning benchmark...")
    response = await saged_service.run_benchmark('nation', config)
    
    print("\nBenchmark run completed!")
    print(f"Status: {response.status}")
    print(f"Message: {response.message}")
    
    if response.status == "success":
        print("\nResults Summary:")
        # Convert results back to DataFrames
        generation_df = pd.DataFrame(response.results['generation'])
        extraction_df = pd.DataFrame(response.results['extraction'])
        
        # Get statistics for the 'mean' analyzer
        statistics_raw_df = pd.DataFrame(response.results['statistics']['mean']['raw'])
        statistics_calibrated_df = pd.DataFrame(response.results['statistics']['mean']['calibrated'])
        
        disparity_raw_df = pd.DataFrame(response.results['disparity']['raw'])
        disparity_calibrated_df = pd.DataFrame(response.results['disparity']['calibrated'])
        
        print(f"Generation results shape: {generation_df.shape}")
        print(f"Extraction results shape: {extraction_df.shape}")
        print(f"Statistics results shape: {statistics_raw_df.shape}")
        print(f"Disparity results shape: {disparity_raw_df.shape}")
        
        print("\nSample of Generation Results:")
        print(generation_df.head())
        
        print("\nSample of Extraction Results:")
        print(extraction_df.head())
        
        print("\nSample of Statistics Results (Raw):")
        print(statistics_raw_df.head())
        
        print("\nSample of Statistics Results (Calibrated):")
        print(statistics_calibrated_df.head())
        
        print("\nSample of Disparity Results (Raw):")
        print(disparity_raw_df.head())
        
        print("\nSample of Disparity Results (Calibrated):")
        print(disparity_calibrated_df.head())
        
        print("\nMetadata Summary:")
        print(f"Table Names: {response.data['table_names']}")
        print(f"Time Stamp: {response.data['time_stamp']}")

        print("\nResponse:")
        print(response)
    else:
        print("\nError occurred during benchmark run!")
        print(f"Error details: {response.message}")

if __name__ == "__main__":
    print("Starting manual benchmark test...")
    asyncio.run(run_manual_benchmark())
    print("\nManual benchmark test completed!") 