from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, JSON, Float, DateTime, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
import pandas as pd
import uuid
from ..schemas.build_config import (
    KeywordsData, SourceFinderData, ScrapedSentencesData,
    ReplacementDescriptionData, BenchmarkData, AllDataTiersResponse,
    BenchmarkMetadata
)
from typing import List, Optional, Dict
from sqlalchemy.exc import SQLAlchemyError
import logging
import json

logger = logging.getLogger(__name__)

class DatabaseService:


     # Class attributes for consistent paths
    source_text_table = 'source_texts'
    _current_file_dir = os.path.dirname(os.path.abspath(__file__))
    _project_root = os.path.abspath(os.path.join(_current_file_dir, "..", ".."))
    _db_dir = os.path.join(_project_root, 'backend', "data", "db")
    _db_path = os.path.join(_db_dir, "saged_app.db")


    def __init__(self):
        os.makedirs(self._db_dir, exist_ok=True)

        self.database_url = f"sqlite:///{self._db_path}"
        
        # Create engine
        self.engine = create_engine(
            self.database_url,
            connect_args={"check_same_thread": False}  # Needed for SQLite
        )
        
        # Create session factory
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Create metadata
        self.metadata = MetaData()
        
        # Initialize database if not exists
        self._initialize_database()
    
    def _initialize_database(self):
        """Initialize the database with required tables if they don't exist"""
        try:
            with self.engine.connect() as conn:
                # Create a test table if it doesn't exist
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS database_status (
                        id INTEGER PRIMARY KEY,
                        status TEXT NOT NULL,
                        last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                
                # Always set the status to active during initialization
                conn.execute(text("""
                    INSERT OR REPLACE INTO database_status (id, status) 
                    VALUES (1, 'active')
                """))
                conn.commit()
        except SQLAlchemyError as e:
            raise Exception(f"Failed to initialize database: {str(e)}")
    
    def is_connected(self) -> bool:
        """Check if the database is connected"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except SQLAlchemyError:
            return False
    
    def is_activated(self) -> bool:
        """Check if the database is activated and ready for use"""
        try:
            with self.engine.connect() as conn:
                # Check if the database_status table exists and has a valid status
                result = conn.execute(text("""
                    SELECT status FROM database_status 
                    WHERE id = 1
                """)).first()
                
                if not result:
                    # If no status exists, create one
                    conn.execute(text("""
                        INSERT INTO database_status (id, status) 
                        VALUES (1, 'active')
                    """))
                    conn.commit()
                    return True
                
                return result[0] == 'active'
        except SQLAlchemyError:
            return False
    
    def test_connection(self):
        """Test the database connection with a simple query"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        except SQLAlchemyError as e:
            raise Exception(f"Database connection test failed: {str(e)}")
    
    def activate_database(self):
        """Activate the database for use"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("""
                    INSERT OR REPLACE INTO database_status (id, status) 
                    VALUES (1, 'active')
                """))
                conn.commit()
        except SQLAlchemyError as e:
            raise Exception(f"Failed to activate database: {str(e)}")
    
    def deactivate_database(self):
        """Deactivate the database"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("""
                    INSERT OR REPLACE INTO database_status (id, status) 
                    VALUES (1, 'inactive')
                """))
                conn.commit()
        except SQLAlchemyError as e:
            raise Exception(f"Failed to deactivate database: {str(e)}")
    
    def get_database_config(self):
        """Get database configuration for SAGED"""
        return {
            'use_database': True,
            'database_type': 'sql',
            'database_connection': self.database_url,
            'source_text_table': self.source_text_table
        }
    
    def get_table_name(self, data_tier: str, domain: str) -> str:
        """Get the table name for a specific data tier with domain and unique ID"""
        # Generate a unique ID for this table instance
        unique_id = str(uuid.uuid4())[:8]  # Use first 8 characters of UUID
        return f"{domain}_{data_tier}_{unique_id}"
    
    def get_session(self):
        """Get a database session"""
        return self.SessionLocal()
    
    def save_benchmark(self, domain: str, data: dict):
        """Save benchmark data"""
        with self.engine.connect() as conn:
            # Handle both DataFrame and JSON data
            if isinstance(data.get('data'), dict):
                # For JSON data
                conn.execute(
                    f"INSERT INTO {self.get_table_name('benchmark', domain)} (domain, concept, data) VALUES (:domain, :concept, :data)",
                    {
                        'domain': domain,
                        'concept': data.get('concept', 'all'),
                        'data': data
                    }
                )
            else:
                # For DataFrame data
                for _, row in data.get('data', pd.DataFrame()).iterrows():
                    conn.execute(
                        f"INSERT INTO {self.get_table_name('benchmark', domain)} (domain, concept, keyword, prompts, baseline, source_tag) VALUES (:domain, :concept, :keyword, :prompts, :baseline, :source_tag)",
                        {
                            'domain': domain,
                            'concept': row.get('concept', 'all'),
                            'keyword': row.get('keyword'),
                            'prompts': row.get('prompts'),
                            'baseline': row.get('baseline'),
                            'source_tag': row.get('source_tag')
                        }
                    )
            conn.commit()
    
    def get_benchmark(self, domain: str, table_name: Optional[str] = None) -> Optional[pd.DataFrame]:
        """Get all benchmark data for a domain"""
        try:
            if table_name is None:
                table_name = self.get_table_name('benchmark', domain)
            with self.engine.connect() as conn:
                df = pd.read_sql_table(table_name, conn)
                return df[df['domain'] == domain]
        except SQLAlchemyError as e:
            logger.error(f"Failed to get benchmark data: {str(e)}")
            return None
    
    def get_latest_benchmark(self, domain: str, table_name: Optional[str] = None) -> Optional[pd.DataFrame]:
        """
        Get all benchmark data for a domain.
        
        Args:
            domain: The domain to get the benchmark for
            table_name: Optional table name override
            
        Returns:
            Optional[pd.DataFrame]: DataFrame containing benchmark data, or None if not found
        """
        try:
            # Activate database before retrieval
            self.activate_database()
            
            with self.engine.connect() as conn:
                table = table_name if table_name else self.get_table_name('benchmark', domain)
                result = pd.read_sql_table(
                    table,
                    conn
                )
                # Return DataFrame if data exists
                return result if not result.empty else None
        except SQLAlchemyError as e:
            logger.error(f"Failed to get benchmark data: {str(e)}")
            return None

    def get_keywords(self, domain: str, table_name: Optional[str] = None) -> List[KeywordsData]:
        """Get keywords data for a domain"""
        with self.engine.connect() as conn:
            table = table_name if table_name else self.get_table_name('keywords', domain)
            result = conn.execute(
                text(f"SELECT * FROM {table} WHERE domain = :domain"),
                {'domain': domain}
            ).fetchall()
            return [KeywordsData(**dict(row)) for row in result]

    def get_latest_keywords(self, domain: str, table_name: Optional[str] = None) -> Optional[KeywordsData]:
        """Get the latest keywords data for a domain"""
        with self.engine.connect() as conn:
            table = table_name if table_name else self.get_table_name('keywords', domain)
            result = conn.execute(
                text(f"SELECT * FROM {table} WHERE domain = :domain ORDER BY created_at DESC LIMIT 1"),
                {'domain': domain}
            ).first()
            return KeywordsData(**dict(result)) if result else None

    def get_source_finder(self, domain: str, table_name: Optional[str] = None) -> List[SourceFinderData]:
        """Get source finder data for a domain"""
        with self.engine.connect() as conn:
            table = table_name if table_name else self.get_table_name('source_finder', domain)
            result = conn.execute(
                text(f"SELECT * FROM {table} WHERE domain = :domain"),
                {'domain': domain}
            ).fetchall()
            return [SourceFinderData(**dict(row)) for row in result]

    def get_latest_source_finder(self, domain: str, table_name: Optional[str] = None) -> Optional[SourceFinderData]:
        """Get the latest source finder data for a domain"""
        with self.engine.connect() as conn:
            table = table_name if table_name else self.get_table_name('source_finder', domain)
            result = conn.execute(
                text(f"SELECT * FROM {table} WHERE domain = :domain ORDER BY created_at DESC LIMIT 1"),
                {'domain': domain}
            ).first()
            return SourceFinderData(**dict(result)) if result else None

    def get_scraped_sentences(self, domain: str, table_name: Optional[str] = None) -> List[ScrapedSentencesData]:
        """Get scraped sentences data for a domain"""
        with self.engine.connect() as conn:
            table = table_name if table_name else self.get_table_name('scraped_sentences', domain)
            result = conn.execute(
                text(f"SELECT * FROM {table} WHERE domain = :domain"),
                {'domain': domain}
            ).fetchall()
            return [ScrapedSentencesData(**dict(row)) for row in result]

    def get_latest_scraped_sentences(self, domain: str, table_name: Optional[str] = None) -> Optional[ScrapedSentencesData]:
        """Get the latest scraped sentences data for a domain"""
        with self.engine.connect() as conn:
            table = table_name if table_name else self.get_table_name('scraped_sentences', domain)
            result = conn.execute(
                text(f"SELECT * FROM {table} WHERE domain = :domain ORDER BY created_at DESC LIMIT 1"),
                {'domain': domain}
            ).first()
            return ScrapedSentencesData(**dict(result)) if result else None

    def get_replacement_description(self, domain: str, table_name: Optional[str] = None) -> List[ReplacementDescriptionData]:
        """Get replacement description data for a domain"""
        with self.engine.connect() as conn:
            table = table_name if table_name else self.get_table_name('replacement_description', domain)
            result = conn.execute(
                text(f"SELECT * FROM {table} WHERE domain = :domain"),
                {'domain': domain}
            ).fetchall()
            return [ReplacementDescriptionData(**dict(row)) for row in result]

    def get_latest_replacement_description(self, domain: str, table_name: Optional[str] = None) -> Optional[ReplacementDescriptionData]:
        """Get the latest replacement description data for a domain"""
        with self.engine.connect() as conn:
            table = table_name if table_name else self.get_table_name('replacement_description', domain)
            result = conn.execute(
                text(f"SELECT * FROM {table} WHERE domain = :domain ORDER BY created_at DESC LIMIT 1"),
                {'domain': domain}
            ).first()
            return ReplacementDescriptionData(**dict(result)) if result else None

    def get_all_data_tiers(self, domain: str) -> AllDataTiersResponse:
        """Get all data tiers for a domain"""
        return AllDataTiersResponse(
            keywords=self.get_latest_keywords(domain),
            source_finder=self.get_latest_source_finder(domain),
            scraped_sentences=self.get_latest_scraped_sentences(domain),
            replacement_description=self.get_latest_replacement_description(domain),
            benchmark=self.get_latest_benchmark(domain)
        )

    def save_benchmark_metadata(self, table_name: str, data: dict):
        """Save benchmark metadata to the specified table"""
        try:
            # Create the table if it doesn't exist
            with self.engine.connect() as conn:
                conn.execute(text(f"""
                    CREATE TABLE IF NOT EXISTS {table_name} (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        domain TEXT NOT NULL,
                        data JSON,
                        table_names JSON,
                        configuration JSON,
                        database_config JSON,
                        time_stamp TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                
                # Convert dictionary fields to JSON strings
                params = {
                    'domain': data['domain'],
                    'data': json.dumps(data['data']) if data['data'] else None,
                    'table_names': json.dumps(data['table_names']),
                    'configuration': json.dumps(data['configuration']),
                    'database_config': json.dumps(data['database_config']),
                    'time_stamp': data['time_stamp']
                }
                
                # Insert the metadata
                conn.execute(
                    text(f"INSERT INTO {table_name} (domain, data, table_names, configuration, database_config, time_stamp) VALUES (:domain, :data, :table_names, :configuration, :database_config, :time_stamp)"),
                    params
                )
                conn.commit()
                logger.info(f"Successfully saved benchmark metadata to {table_name}")
        except SQLAlchemyError as e:
            logger.error(f"Failed to save benchmark metadata: {str(e)}")
            raise Exception(f"Failed to save benchmark metadata: {str(e)}")

    def list_benchmark_metadata(self) -> Dict[str, List[BenchmarkMetadata]]:
        """Retrieve all benchmark metadata from tables starting with metadata_benchmark_
        but excluding tables containing 'metadata_benchmark_run_'
        
        Returns:
            Dict[str, List[BenchmarkMetadata]]: Dictionary mapping table names to their metadata entries
        """
        try:
            # First check if database is initialized and try to activate if not
            if not self.is_activated():
                logger.warning("Database is not activated. Attempting to activate...")
                self.activate_database()
                if not self.is_activated():
                    logger.error("Failed to activate database. Returning empty metadata dictionary.")
                    return {}

            with self.engine.connect() as conn:
                # Get all tables starting with metadata_benchmark_ but excluding metadata_benchmark_run_
                result = conn.execute(text("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' 
                    AND name LIKE 'metadata_benchmark_%'
                    AND name NOT LIKE 'metadata_benchmark_run_%'
                """))
                tables = [row[0] for row in result.fetchall()]
                
                if not tables:
                    logger.info("No benchmark metadata tables found. Returning empty dictionary.")
                    return {}
                
                metadata_dict = {}
                for table in tables:
                    # Get all entries from each metadata table
                    result = conn.execute(text(f"SELECT * FROM {table}"))
                    rows = result.fetchall()
                    
                    # Convert each row to BenchmarkMetadata
                    metadata_list = []
                    for row in rows:
                        # Convert row to dict and parse JSON fields
                        row_dict = dict(row._mapping)
                        metadata = BenchmarkMetadata(
                            id=row_dict['id'],
                            domain=row_dict['domain'],
                            data=json.loads(row_dict['data']) if row_dict['data'] else None,
                            table_names=json.loads(row_dict['table_names']),
                            configuration=json.loads(row_dict['configuration']),
                            database_config=json.loads(row_dict['database_config']),
                            time_stamp=row_dict['time_stamp'],
                            created_at=row_dict['created_at']
                        )
                        metadata_list.append(metadata)
                    
                    metadata_dict[table] = metadata_list
                
                return metadata_dict
                
        except SQLAlchemyError as e:
            logger.error(f"Failed to list benchmark metadata: {str(e)}")
            raise Exception(f"Failed to list benchmark metadata: {str(e)}")

    def get_benchmark_run_table_names(self, domain: str) -> Dict[str, str]:
        """Get all table names for a benchmark run"""
        return {
            "generation": self.get_table_name('benchmark_generation', domain),
            "extraction": self.get_table_name('benchmark_extraction', domain),
            "statistics": self.get_table_name('benchmark_statistics', domain),
            "disparity": self.get_table_name('benchmark_disparity', domain),
            "calibrated_statistics": self.get_table_name('benchmark_calibrated_statistics', domain),
            "calibrated_disparity": self.get_table_name('benchmark_calibrated_disparity', domain)
        }

    def _create_benchmark_run_tables(self, table_name: str):
        """Create tables for benchmark run data if they don't exist"""
        try:
            with self.engine.connect() as conn:
                # Create table for generation results
                conn.execute(text(f"""
                    CREATE TABLE IF NOT EXISTS {table_name} (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        domain TEXT NOT NULL,
                        data JSON,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                conn.commit()
        except SQLAlchemyError as e:
            logger.error(f"Failed to create benchmark run table {table_name}: {str(e)}")
            raise Exception(f"Failed to create benchmark run table: {str(e)}")

    def save_benchmark_generation(self, domain: str, data: pd.DataFrame):
        """Save generation results"""
        try:
            table_name = self.get_table_name('benchmark_generation', domain)
            self._create_benchmark_run_tables(table_name)
            
            with self.engine.connect() as conn:
                data.to_sql(table_name, conn, if_exists='replace', index=False)
                conn.commit()
            logger.info(f"Successfully saved generation results to {table_name}")
        except SQLAlchemyError as e:
            logger.error(f"Failed to save generation results: {str(e)}")
            raise Exception(f"Failed to save generation results: {str(e)}")

    def save_benchmark_extraction(self, domain: str, data: pd.DataFrame):
        """Save feature extraction results"""
        try:
            table_name = self.get_table_name('benchmark_extraction', domain)
            self._create_benchmark_run_tables(table_name)
            
            with self.engine.connect() as conn:
                data.to_sql(table_name, conn, if_exists='replace', index=False)
                conn.commit()
            logger.info(f"Successfully saved extraction results to {table_name}")
        except SQLAlchemyError as e:
            logger.error(f"Failed to save extraction results: {str(e)}")
            raise Exception(f"Failed to save extraction results: {str(e)}")

    def save_benchmark_statistics(self, domain: str, data: pd.DataFrame, is_calibrated: bool = False):
        """Save statistics results"""
        try:
            table_name = self.get_table_name('benchmark_statistics', domain)
            if is_calibrated:
                table_name = self.get_table_name('benchmark_calibrated_statistics', domain)
            
            self._create_benchmark_run_tables(table_name)
            
            with self.engine.connect() as conn:
                data.to_sql(table_name, conn, if_exists='replace', index=False)
                conn.commit()
            logger.info(f"Successfully saved statistics results to {table_name}")
        except SQLAlchemyError as e:
            logger.error(f"Failed to save statistics results: {str(e)}")
            raise Exception(f"Failed to save statistics results: {str(e)}")

    def save_benchmark_disparity(self, domain: str, data: pd.DataFrame, is_calibrated: bool = False):
        """Save disparity results"""
        try:
            table_name = self.get_table_name('benchmark_disparity', domain)
            if is_calibrated:
                table_name = self.get_table_name('benchmark_calibrated_disparity', domain)
            
            self._create_benchmark_run_tables(table_name)
            
            with self.engine.connect() as conn:
                data.to_sql(table_name, conn, if_exists='replace', index=False)
                conn.commit()
            logger.info(f"Successfully saved disparity results to {table_name}")
        except SQLAlchemyError as e:
            logger.error(f"Failed to save disparity results: {str(e)}")
            raise Exception(f"Failed to save disparity results: {str(e)}")

    def get_benchmark_generation(self, domain: str, table_name: Optional[str] = None) -> Optional[pd.DataFrame]:
        """Get generation results"""
        try:
            if table_name is None:
                table_name = self.get_table_name('benchmark_generation', domain)
            with self.engine.connect() as conn:
                return pd.read_sql_table(table_name, conn)
        except SQLAlchemyError as e:
            logger.error(f"Failed to get generation results: {str(e)}")
            return None

    def get_benchmark_extraction(self, domain: str, table_name: Optional[str] = None) -> Optional[pd.DataFrame]:
        """Get feature extraction results"""
        try:
            if table_name is None:
                table_name = self.get_table_name('benchmark_extraction', domain)
            with self.engine.connect() as conn:
                return pd.read_sql_table(table_name, conn)
        except SQLAlchemyError as e:
            logger.error(f"Failed to get extraction results: {str(e)}")
            return None

    def get_benchmark_statistics(self, domain: str, table_name: Optional[str] = None, is_calibrated: bool = False) -> Optional[pd.DataFrame]:
        """Get statistics results"""
        try:
            if table_name is None:
                table_name = self.get_table_name('benchmark_statistics', domain)
                if is_calibrated:
                    table_name = self.get_table_name('benchmark_calibrated_statistics', domain)
            elif is_calibrated and 'calibrated' not in table_name:
                table_name = f"{table_name}_calibrated"
            with self.engine.connect() as conn:
                return pd.read_sql_table(table_name, conn)
        except SQLAlchemyError as e:
            logger.error(f"Failed to get statistics results: {str(e)}")
            return None

    def get_benchmark_disparity(self, domain: str, table_name: Optional[str] = None, is_calibrated: bool = False) -> Optional[pd.DataFrame]:
        """Get disparity results"""
        try:
            if table_name is None:
                table_name = self.get_table_name('benchmark_disparity', domain)
                if is_calibrated:
                    table_name = self.get_table_name('benchmark_calibrated_disparity', domain)
            elif is_calibrated:
                table_name = f"{table_name}_calibrated"
            with self.engine.connect() as conn:
                return pd.read_sql_table(table_name, conn)
        except SQLAlchemyError as e:
            logger.error(f"Failed to get disparity results: {str(e)}")
            return None

    def save_benchmark_run_metadata(self, domain: str, data: dict):
        """Save metadata for a benchmark run"""
        try:
            table_name = f"metadata_benchmark_run_{domain}_{self.get_table_name('metadata', domain)}"
            
            # Create the metadata table if it doesn't exist
            with self.engine.connect() as conn:
                conn.execute(text(f"""
                    CREATE TABLE IF NOT EXISTS {table_name} (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        domain TEXT NOT NULL,
                        data JSON,
                        table_names JSON,
                        configuration JSON,
                        database_config JSON,
                        time_stamp TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                
                # Convert dictionary fields to JSON strings
                params = {
                    'domain': domain,
                    'data': json.dumps(data.get('data')) if data.get('data') else None,
                    'table_names': json.dumps(data.get('table_names', {})),
                    'configuration': json.dumps(data.get('configuration', {})),
                    'database_config': json.dumps(data.get('database_config', {})),
                    'time_stamp': data.get('time_stamp', datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
                }
                
                # Insert the metadata
                conn.execute(
                    text(f"INSERT INTO {table_name} (domain, data, table_names, configuration, database_config, time_stamp) VALUES (:domain, :data, :table_names, :configuration, :database_config, :time_stamp)"),
                    params
                )
                conn.commit()
                logger.info(f"Successfully saved benchmark run metadata to {table_name}")
        except SQLAlchemyError as e:
            logger.error(f"Failed to save benchmark run metadata: {str(e)}")
            raise Exception(f"Failed to save benchmark run metadata: {str(e)}")

    def get_benchmark_run_metadata(self, domain: str) -> Optional[Dict]:
        """Get metadata for a benchmark run"""
        try:
            table_name = f"metadata_benchmark_run_{domain}_{self.get_table_name('metadata', domain)}"
            with self.engine.connect() as conn:
                result = conn.execute(text(f"SELECT * FROM {table_name} ORDER BY created_at DESC LIMIT 1")).first()
                if result:
                    return {
                        'id': result.id,
                        'domain': result.domain,
                        'data': json.loads(result.data) if result.data else None,
                        'table_names': json.loads(result.table_names),
                        'configuration': json.loads(result.configuration),
                        'database_config': json.loads(result.database_config),
                        'time_stamp': result.time_stamp,
                        'created_at': result.created_at
                    }
                return None
        except SQLAlchemyError as e:
            logger.error(f"Failed to get benchmark run metadata: {str(e)}")
            return None 