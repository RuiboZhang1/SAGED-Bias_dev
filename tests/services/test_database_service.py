import pytest
from datetime import datetime
from app.backend.services.database_service import DatabaseService
from app.backend.schemas.build_config import BenchmarkMetadata

@pytest.fixture
def db_service():
    """Fixture to create a database service instance"""
    return DatabaseService()

@pytest.fixture
def sample_metadata():
    """Fixture to create sample metadata for testing"""
    return {
        'domain': 'test_domain',
        'data': {'key': 'value'},
        'table_names': {'table1': 'name1'},
        'configuration': {'config': 'value'},
        'database_config': {'db': 'config'},
        'time_stamp': datetime.now().isoformat()
    }

def test_list_benchmark_metadata(db_service, sample_metadata):
    """Test listing benchmark metadata from tables"""
    # Create a test metadata table
    test_table = 'metadata_benchmark_test'
    
    # Save some test metadata
    db_service.save_benchmark_metadata(test_table, sample_metadata)
    
    # Get all metadata
    metadata_dict = db_service.list_benchmark_metadata()
    
    # Verify results
    assert test_table in metadata_dict
    assert len(metadata_dict[test_table]) > 0
    
    # Verify the metadata content
    metadata = metadata_dict[test_table][0]
    assert isinstance(metadata, BenchmarkMetadata)
    assert metadata.domain == sample_metadata['domain']
    assert metadata.data == sample_metadata['data']
    assert metadata.table_names == sample_metadata['table_names']
    assert metadata.configuration == sample_metadata['configuration']
    assert metadata.database_config == sample_metadata['database_config']
    assert metadata.time_stamp == sample_metadata['time_stamp']

def test_list_benchmark_metadata_empty(db_service):
    """Test listing benchmark metadata when no tables exist"""
    # Get all metadata
    metadata_dict = db_service.list_benchmark_metadata()
    
    # Verify empty result
    assert isinstance(metadata_dict, dict)
    assert len(metadata_dict) == 0 