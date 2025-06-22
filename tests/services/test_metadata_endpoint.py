import requests
import json
from typing import Dict, List
from app.backend.schemas.build_config import BenchmarkMetadata

def test_benchmark_metadata_endpoint():
    """Test the benchmark metadata endpoint"""
    url = "http://localhost:8000/db/benchmark-metadata"
    headers = {"accept": "application/json"}
    
    print(f"\nTesting endpoint: {url}")
    
    try:
        # Make the request
        print("Making request...")
        response = requests.get(url, headers=headers)
        print(f"Response status code: {response.status_code}")
        
        response.raise_for_status()
        
        # Get the response data
        data = response.json()
        print(f"Response data type: {type(data)}")
        
        # Basic validation
        assert isinstance(data, dict), "Response should be a dictionary"
        assert len(data) > 0, "Response should not be empty"
        
        print(f"\nFound {len(data)} metadata tables")
        
        # Check each table's metadata
        for table_name, metadata_list in data.items():
            print(f"\nChecking table: {table_name}")
            assert table_name.startswith("metadata_benchmark_"), f"Table name {table_name} should start with metadata_benchmark_"
            assert isinstance(metadata_list, list), f"Metadata for {table_name} should be a list"
            
            print(f"Found {len(metadata_list)} entries in {table_name}")
            
            # Check each metadata entry
            for metadata in metadata_list:
                # Validate required fields
                assert "domain" in metadata, "Metadata should have domain field"
                assert "table_names" in metadata, "Metadata should have table_names field"
                assert "configuration" in metadata, "Metadata should have configuration field"
                assert "database_config" in metadata, "Metadata should have database_config field"
                assert "time_stamp" in metadata, "Metadata should have time_stamp field"
                
                # Validate field types
                assert isinstance(metadata["domain"], str), "Domain should be a string"
                assert isinstance(metadata["table_names"], dict), "Table names should be a dictionary"
                assert isinstance(metadata["configuration"], dict), "Configuration should be a dictionary"
                assert isinstance(metadata["database_config"], dict), "Database config should be a dictionary"
                assert isinstance(metadata["time_stamp"], str), "Time stamp should be a string"
        
        # Pretty print the response for inspection
        print("\nBenchmark Metadata Response:")
        print(json.dumps(data, indent=2))
        
        print("\nTest passed successfully!")
        
    except requests.exceptions.ConnectionError as e:
        print(f"Connection error: {e}")
        print("Make sure the FastAPI server is running at http://localhost:8000")
        raise
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        raise
    except AssertionError as e:
        print(f"Validation failed: {e}")
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise

if __name__ == "__main__":
    test_benchmark_metadata_endpoint() 