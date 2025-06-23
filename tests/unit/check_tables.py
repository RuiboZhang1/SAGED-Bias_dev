import sys
import os
import logging
from sqlalchemy import inspect, create_engine

# Add the project root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.backend.services.database_service import DatabaseService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_database_tables():
    """Check all tables in the database"""
    try:
        # Initialize the database service
        db_service = DatabaseService()
        
        # Get the engine
        engine = db_service.engine
        
        # Create an inspector
        inspector = inspect(engine)
        
        # Get all table names
        tables = inspector.get_table_names()
        
        logger.info("All tables in the database:")
        for table in tables:
            logger.info(f"- {table}")
            
        # Check if our specific table exists
        if "Company_benchmark_17bd1ca4" in tables:
            logger.info("\nCompany_benchmark_17bd1ca4 table exists!")
            # Get columns for this table
            columns = inspector.get_columns("Company_benchmark_17bd1ca4")
            logger.info("\nColumns in Company_benchmark_17bd1ca4:")
            for column in columns:
                logger.info(f"- {column['name']}: {column['type']}")
        else:
            logger.warning("\nCompany_benchmark_17bd1ca4 table NOT found!")
            
    except Exception as e:
        logger.error(f"Error checking database: {str(e)}")
        raise

if __name__ == "__main__":
    check_database_tables() 