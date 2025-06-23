from app.backend.services.database_service import DatabaseService
from datetime import datetime
import json

def test_run_benchmark_metadata():
    # Initialize database service
    db_service = DatabaseService()
    
    # Create sample metadata
    sample_metadata = {
        'domain': 'test_domain',
        'data': {'key': 'value', 'test': 123},
        'table_names': {'table1': 'name1', 'table2': 'name2'},
        'configuration': {'config': 'value', 'settings': {'option1': True}},
        'database_config': {'db': 'config', 'type': 'sqlite'},
        'time_stamp': datetime.now().isoformat()
    }
    
    # Save metadata to two different tables
    table1 = 'metadata_benchmark_test1'
    table2 = 'metadata_benchmark_test2'
    
    print("\nSaving test metadata...")
    db_service.save_benchmark_metadata(table1, sample_metadata)
    db_service.save_benchmark_metadata(table2, sample_metadata)
    
    # Get all metadata
    print("\nRetrieving all benchmark metadata...")
    metadata_dict = db_service.list_benchmark_metadata()
    
    # Print results
    print("\nResults:")
    print("=" * 50)
    for table_name, metadata_list in metadata_dict.items():
        print(f"\nTable: {table_name}")
        print("-" * 30)
        for metadata in metadata_list:
            print(f"Domain: {metadata.domain}")
            print(f"Data: {json.dumps(metadata.data, indent=2)}")
            print(f"Table Names: {json.dumps(metadata.table_names, indent=2)}")
            print(f"Configuration: {json.dumps(metadata.configuration, indent=2)}")
            print(f"Database Config: {json.dumps(metadata.database_config, indent=2)}")
            print(f"Time Stamp: {metadata.time_stamp}")
            print(f"Created At: {metadata.created_at}")
            print("-" * 30)

if __name__ == "__main__":
    test_run_benchmark_metadata() 