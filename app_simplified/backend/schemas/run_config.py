from typing import List, Dict, Optional, Any, Union
from pydantic import BaseModel
from datetime import datetime
from .build_config import DatabaseConfig

class GenerationConfig(BaseModel):
    """Configuration for generation step"""
    require: bool = True
    generate_dict: Dict[str, Any] = {}
    generation_saving_location: str = 'data/customized/_sbg_benchmark.csv'
    generation_list: List[str] = []
    baseline: str = 'baseline'

class ExtractionConfig(BaseModel):
    """Configuration for feature extraction step"""
    feature_extractors: List[str] = [
        'personality_classification',
        'toxicity_classification',
        'sentiment_classification',
        'stereotype_classification',
        'regard_classification'
    ]
    extractor_configs: Dict[str, Any] = {}
    calibration: bool = True
    extraction_saving_location: str = 'data/customized/_sbge_benchmark.csv'

class AnalysisConfig(BaseModel):
    """Configuration for analysis step"""
    specifications: List[str] = ['concept', 'source_tag']
    analyzers: List[str] = ['mean', 'selection_rate', 'precision']
    analyzer_configs: Dict[str, Any] = {
        'selection_rate': {'standard_by': 'mean'},
        'precision': {'tolerance': 0.1}
    }
    statistics_saving_location: str = 'data/customized/_sbgea_statistics.csv'
    disparity_saving_location: str = 'data/customized/_sbgea_disparity.csv'

class RunBenchmarkConfig(BaseModel):
    """Main configuration for running a benchmark"""
    database_config: DatabaseConfig = DatabaseConfig()
    benchmark: Optional[Any] = None  # The benchmark data to analyze
    generation: GenerationConfig = GenerationConfig()
    extraction: ExtractionConfig = ExtractionConfig()
    analysis: AnalysisConfig = AnalysisConfig()

# Response Models
class GenerationResult(BaseModel):
    """Schema for generation results"""
    id: Optional[int]
    domain: str
    data: Dict[str, Any]
    created_at: datetime

class ExtractionResult(BaseModel):
    """Schema for feature extraction results"""
    id: Optional[int]
    domain: str
    data: Dict[str, Any]
    created_at: datetime

class StatisticsResult(BaseModel):
    """Schema for statistics results"""
    id: Optional[int]
    domain: str
    data: Dict[str, Any]
    is_calibrated: bool = False
    created_at: datetime

class DisparityResult(BaseModel):
    """Schema for disparity results"""
    id: Optional[int]
    domain: str
    data: Dict[str, Any]
    is_calibrated: bool = False
    created_at: datetime

class RunBenchmarkMetadata(BaseModel):
    """Schema for run benchmark metadata"""
    id: Optional[int]
    domain: str
    data: Optional[Dict[str, Any]]
    table_names: Dict[str, str]
    configuration: Dict[str, Any]
    database_config: Dict[str, Any]
    time_stamp: str
    created_at: Optional[datetime]

class RunBenchmarkResponse(BaseModel):
    """Schema for run benchmark response"""
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None
