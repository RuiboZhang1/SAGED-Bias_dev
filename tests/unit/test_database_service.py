import sys
import os
import logging
import pandas as pd

# Add the project root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.backend.services.database_service import DatabaseService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_get_latest_benchmark():
    """
    Test for get_latest_benchmark function using the Company_benchmark_17bd1ca4 table.
    """
    try:
        # Initialize the database service
        db_service = DatabaseService()
        
        # Test parameters
        domain = "Company"
        table_name = "Company_benchmark_d3b95030"
        
        # Get the benchmark data
        logger.info(f"Fetching benchmark data for domain: {domain}, table: {table_name}")
        results = db_service.get_latest_benchmark(domain, table_name)
        
        # Print the results
        if isinstance(results, pd.DataFrame):
            logger.info(f"Successfully retrieved DataFrame with shape: {results.shape}")
            logger.info("\nDataFrame Info:")
            logger.info(results.info())
            logger.info("\nFirst few rows:")
            logger.info(results.head())
        else:
            logger.warning("No benchmark data found or invalid data type returned")
            
    except Exception as e:
        logger.error(f"Test failed with error: {str(e)}")
        raise

if __name__ == "__main__":
    test_get_latest_benchmark() 