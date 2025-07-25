from ._generator import ResponseGenerator
from ._extractor import FeatureExtractor
from ._diagnoser import DisparityDiagnoser as Analyzer
import pandas as pd
from ._saged_data import SAGEDData as saged
from ._scrape import KeywordFinder, SourceFinder, Scraper, check_generation_function
from ._assembler import PromptAssembler as PromptMaker
from ._utility import _update_configuration
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, JSON, Float, DateTime
from datetime import datetime
import os
from tqdm import tqdm

class Pipeline:
    _branching_config_scheme = {}
    _concept_benchmark_config_scheme = {}
    _domain_benchmark_config_scheme = {}
    _branching_default_config = {}
    _concept_benchmark_default_config = {}
    _domain_benchmark_default_config = {}
    _analytics_config_scheme = {}
    _analytics_default_config = {}
    _database_config_scheme = {}
    _database_default_config = {}
    _llm_inquiries_config_scheme = {}
    _llm_inquiries_default_config = {}
    database_config = {}

    def __init__(self):
        """Initialize Pipeline with database configuration
        
        Args:
            database_config (dict, optional): Database configuration dictionary. If None, uses default configuration.
        """
        self._set_config()

    @classmethod
    def _set_config(cls):
        cls._database_config_scheme = {
            'use_database': None,
            'database_type': None,  # 'sql' or 'json' or 'sqlite'
            'database_connection': None,  # Connection string or path
            'table_prefix': None,  # Prefix for database tables
            'source_text_table': None,  # Table name for storing source texts
        }
        
        cls._database_default_config = {
            'use_database': False,
            'database_type': 'json',
            'database_connection': 'data/customized/database',
            'table_prefix': '',
            'source_text_table': 'source_texts',  # Default table name for source texts
        }

        cls._llm_inquiries_config_scheme = {
            'n_run': None,
            'n_keywords': None,
            'generation_function': None,
            'model_name': None,
            'embedding_model': None,
            'show_progress': None
        }

        cls._llm_inquiries_default_config = {
            'n_run': 20,
            'n_keywords': 20,
            'generation_function': None,
            'model_name': None,
            'embedding_model': None,
            'show_progress': True
        }

        cls._branching_config_scheme = {
            'branching_pairs': None,
            'direction': None,
            'source_restriction': None,
            'replacement_descriptor_require': None,
            'descriptor_threshold': None,
            'descriptor_embedding_model': None,
            'descriptor_distance': None,
            'replacement_description': None,
            'replacement_description_saving': None,
            'replacement_description_saving_location': None,
            'counterfactual_baseline': None,
            'generation_function': None,
        }
        cls._concept_benchmark_config_scheme = {
            'keyword_finder': {
                'require': None,
                'reading_location': None,
                'method': None,
                'keyword_number': None,
                'hyperlinks_info': None,
                'llm_info': cls._llm_inquiries_config_scheme,
                'max_adjustment': None,
                'embedding_model': None,
                'saving': None,
                'saving_location': None,
                'manual_keywords': None,
            },
            'source_finder': {
                'require': None,
                'reading_location': None,
                'method': None,
                'local_file': None,
                'scrape_number': None,
                'saving': None,
                'saving_location': None,
                'scrape_backlinks': None,
                'manual_sources': None,  # List of direct file paths to use
            },
            'scraper': {
                'require': None,
                'reading_location': None,
                'saving': None,
                'method': None,  # This is related to the source_finder method,
                'saving_location': None},
            'prompt_assembler': {
                'require': None,
                'method': None,
                'generation_function': None,
                'keyword_list': None,
                'answer_check': None,
                'saving_location': None,
                'max_benchmark_length': None,
            },
        }
        cls._domain_benchmark_config_scheme = {
            'concepts': None,
            'branching': None,
            # If branching is False, then branching_config is not taken into account
            'branching_config': None,
            'shared_config': None,
            'concept_specified_config': None,
            'saving': None,
            # If saving is False, then saving_location is not taken into account
            'saving_location': None,
            'database_config': cls._database_config_scheme,
        }
        cls._branching_default_config = {
            'branching_pairs': 'not_all',
            'direction': 'both',
            'source_restriction': None,
            'replacement_descriptor_require': False,
            'descriptor_threshold': 'Auto',
            'descriptor_embedding_model': 'paraphrase-Mpnet-base-v2',
            'descriptor_distance': 'cosine',
            'replacement_description': {},
            'replacement_description_saving': True,
            'replacement_description_saving_location': f'data/customized/benchmark/replacement_description.json',
            'counterfactual_baseline': True,
            'generation_function': None,
        }
        cls._concept_benchmark_default_config = {
            'keyword_finder': {
                'require': True,
                'reading_location': 'default',
                'method': 'embedding_on_wiki',  # 'embedding_on_wiki' or 'llm_inquiries' or 'hyperlinks_on_wiki'
                'keyword_number': 7,  # keyword_number works for both embedding_on_wiki and hyperlinks_on_wiki
                'hyperlinks_info': [],
                # If hyperlinks_info is method chosen, can give more info... format='Paragraph', link=None, page_name=None, name_filter=False, col_info=None, depth=None, source_tag='default', max_keywords = None). col_info format is [{'table_num': value, 'column_name':List}]
                'llm_info': cls._llm_inquiries_default_config,
                # If llm_inequiries is method chosen, can give more info... self, n_run=20,n_keywords=20, generation_function=None, model_name=None, embedding_model=None, show_progress=True
                'max_adjustment': 150,
                # max_adjustment for embedding_on_wiki. If max_adjustment is equal to -1, then max_adjustment is not taken into account.
                'embedding_model': 'paraphrase-Mpnet-base-v2',
                'saving': True,
                'saving_location': 'default',
                'manual_keywords': None,
            },
            'source_finder': {
                'require': True,
                'reading_location': 'default',
                'method': 'wiki',  # 'wiki' or 'local_files',
                'local_file': None,
                'scrape_number': 5,
                'saving': True,
                'saving_location': 'default',
                'scrape_backlinks': 0,
                'manual_sources': [],  # Default empty list for manual sources
            },
            'scraper': {
                'require': True,
                'reading_location': 'default',
                'saving': True,
                'method': 'wiki',  # This is related to the source_finder method,
                'saving_location': 'default'},
            'prompt_assembler': {
                'require': True,
                'method': 'split_sentences',  # can also have "questions" as a method
                # prompt_assembler_generation_function and prompt_assembler_keyword_list are needed for questions
                'generation_function': None,
                # prompt_assembler_keyword_list must contain at least one keyword. The first keyword must be the keyword
                # of the original scraped data.
                'keyword_list': None,
                # User will enter False if they don't want their questions answer checked.
                'answer_check': False,
                'saving_location': 'default',
                'max_benchmark_length': 500,
            },
        }
        cls._domain_benchmark_default_config = {
            'concepts': [],
            'branching': False,  # If branching is False, then branching_config is not taken into account
            'branching_config': cls._branching_default_config,
            'shared_config': cls._concept_benchmark_default_config,
            'concept_specified_config': {},
            'saving': True,  # If saving is False, then saving_location is not taken into account
            'saving_location': 'default',
            'database_config': cls._database_default_config,
        }
        cls._analytics_config_scheme = {
            "database_config": cls._database_default_config,
            "benchmark": None,
            "generation": {
                "require": None,
                "generate_dict": None,
                "generation_saving_location": None,
                "generation_list": None,
            },
            "extraction": {
                "feature_extractors": None,
                'extractor_configs': None,
                "calibration": None,
                "extraction_saving_location": None,
            },
            "analysis": {
                "specifications": None,
                "analyzers": None,
                "analyzer_configs": None,
                'statistics_saving_location': None,
                "disparity_saving_location": None,
            }
        }
        cls._analytics_default_config = {
            "database_config": cls._database_default_config,
            "generation": {
                "require": True,
                "generate_dict": {},
                "generation_saving_location": 'data/customized/' + '_' + 'sbg_benchmark.csv',
                "generation_list": [],
                "baseline": 'baseline',
            },
            "extraction": {
                "feature_extractors": [
                    'personality_classification',
                    'toxicity_classification',
                    'sentiment_classification',
                    'stereotype_classification',
                    'regard_classification'
                ],
                'extractor_configs': {},
                "calibration": True,
                "extraction_saving_location": 'data/customized/' + '_' + 'sbge_benchmark.csv',
            },
            "analysis": {
                "specifications": ['concept', 'source_tag'],
                "analyzers": ['mean', 'selection_rate', 'precision'],
                "analyzer_configs": {
                    'selection_rate': {'standard_by': 'mean'},
                    'precision': {'tolerance': 0.1}
                },
                'statistics_saving_location': 'data/customized/' + '_' + 'sbgea_statistics.csv',
                "disparity_saving_location": 'data/customized/' + '_' + 'sbgea_disparity.csv',
            }
        }

    @classmethod
    def config_helper(cls):
        pass

    @classmethod
    def _get_database_connection(cls, database_config):
        """Get database connection based on configuration"""
        if not database_config.get('use_database'):
            return None
            
        if database_config.get('database_type') == 'sql':
            if 'database_connection' in database_config:
                return create_engine(database_config['database_connection'])
            else:
                # Default SQLite connection
                db_path = os.path.join('data', 'customized', 'database', 'saged_app.db')
                os.makedirs(os.path.dirname(db_path), exist_ok=True)
                return create_engine(f'sqlite:///{db_path}')
        return None

    @classmethod
    def _get_table_name(cls, name, database_config):
        """Get table name with prefix"""
        prefix = database_config.get('table_prefix', 'saged_')
        return f"{prefix}{name}"

    @classmethod
    def _save_to_database(cls, df, table_name, database_config):
        """Save DataFrame to database"""
        engine = cls._get_database_connection(database_config)
        if not engine:
            return False

        try:
            # Save DataFrame directly to table
            with engine.connect() as conn:
                df.to_sql(table_name, conn, if_exists='replace', index=False)
                conn.commit()
            return True
        except Exception as e:
            print(f"Error saving to database: {e}")
            return False

    @classmethod
    def _load_from_database(cls, table_name, database_config):
        """Load data from database"""
        engine = cls._get_database_connection(database_config)
        if not engine:
            return None

        try:
            # Load DataFrame directly from table
            with engine.connect() as conn:
                return pd.read_sql_table(table_name, conn)
        except Exception as e:
            print(f"Error loading from database: {e}")
            return None

    @classmethod
    def build_concept_benchmark(cls, domain, demographic_label, config=None):
      
        cls._set_config()
        configuration = _update_configuration(
            cls._concept_benchmark_config_scheme.copy(),
            cls._concept_benchmark_default_config.copy(),
            config.copy())

        # Get database configuration
        database_config = cls.database_config
        print("database_config", database_config)

        # Create initial data
        kw = saged.create_data(domain=domain, concept=demographic_label, data_tier='keywords')
        kw.use_database = database_config['use_database']
        kw.database_config = database_config

        # Unpacking keyword_finder section
        keyword_finder_config = configuration['keyword_finder']
        keyword_finder_require, keyword_finder_reading_location, keyword_finder_method, \
        keyword_finder_keyword_number, keyword_finder_hyperlinks_info, keyword_finder_llm_info, \
        keyword_finder_max_adjustment, keyword_finder_embedding_model, keyword_finder_saving, \
        keyword_finder_saving_location, keyword_finder_manual_keywords = (
            keyword_finder_config[key] for key in [
            'require', 'reading_location', 'method', 'keyword_number', 'hyperlinks_info',
            'llm_info', 'max_adjustment', 'embedding_model', 'saving', 'saving_location',
            'manual_keywords'
        ]
        )

        # Unpacking source_finder section
        source_finder_config = configuration['source_finder']
        source_finder_require, source_finder_reading_location, source_finder_method, \
        source_finder_local_file, source_finder_saving, source_finder_saving_location, \
        source_finder_scrap_area_number, source_finder_scrap_backlinks, source_finder_manual_sources = (
            source_finder_config[key] for key in [
            'require', 'reading_location', 'method', 'local_file', 'saving',
            'saving_location', 'scrape_number', 'scrape_backlinks', 'manual_sources'
        ]
        )

        # Unpacking scraper section
        scraper_config = configuration['scraper']
        scraper_require, scraper_reading_location, scraper_saving, \
        scraper_method, scraper_saving_location = (
            scraper_config[key] for key in [
            'require', 'reading_location', 'saving', 'method', 'saving_location'
        ]
        )

        # Unpacking prompt_assembler section
        prompt_assembler_config = configuration['prompt_assembler']
        prompt_assembler_require, prompt_assembler_method, prompt_assembler_generation_function, \
        prompt_assembler_keyword_list, prompt_assembler_answer_check, prompt_assembler_saving_location, \
        prompt_assembler_max_sample_number = (
            prompt_assembler_config[key] for key in [
            'require', 'method', 'generation_function', 'keyword_list', 'answer_check',
            'saving_location', 'max_benchmark_length'
        ]
        )

        # check the validity of the configuration
        assert keyword_finder_method in ['embedding_on_wiki', 'llm_inquiries',
                                         'hyperlinks_on_wiki'], "Invalid keyword finder method. Choose either 'embedding_on_wiki', 'llm_inquiries', or 'hyperlinks_on_wiki'."
        if keyword_finder_method == 'llm_inquiries':
            assert 'generation_function' in keyword_finder_llm_info and keyword_finder_llm_info[
                'generation_function'] is not None, "generation function must be provided if llm_inquiries is chosen as the method"
            check_generation_function(keyword_finder_llm_info['generation_function'])
        assert source_finder_method in ['wiki',
                                        'local_files'], "Invalid scrap area finder method. Choose either 'wiki' or 'local_files'"
        assert scraper_method in ['wiki',
                                  'local_files'], "Invalid scraper method. Choose either 'wiki' or 'local_files'"
        assert source_finder_method == scraper_method, "source_finder_finder and scraper methods must be the same"
        assert prompt_assembler_method in ['split_sentences',
                                       'questions'], "Invalid prompt maker method. Choose 'split_sentences' or 'questions'"

        '''
        # make sure only the required loading is done
        if not scraper_require:
            source_finder_finder_require = False

        if not source_finder_finder_require:
            keyword_finder_require = False
        '''

        if keyword_finder_require:
            if keyword_finder_method == 'embedding_on_wiki':
                kw = KeywordFinder(domain=domain, concept=demographic_label).wiki_embeddings(
                    n_keywords=keyword_finder_keyword_number, embedding_model=keyword_finder_embedding_model,
                    max_adjustment=keyword_finder_max_adjustment).add(
                    keyword=demographic_label)
            elif keyword_finder_method == 'llm_inquiries':
                # Get default values from configuration
                default_values = _update_configuration(
                    cls._llm_inquiries_config_scheme.copy(),
                    cls._llm_inquiries_default_config.copy(),
                    keyword_finder_llm_info.copy()
                )

                kw = KeywordFinder(domain=domain, concept=demographic_label).lm_inquiries(
                    **default_values).add(
                    keyword=demographic_label)
            
            kw.use_database = database_config['use_database']
            kw.database_config = database_config

            # if manual keywords are provided, add them to the keyword finder
            if isinstance(keyword_finder_manual_keywords, list):
                for keyword in keyword_finder_manual_keywords:
                    kw = kw.add(keyword)

            if keyword_finder_saving:
                if keyword_finder_saving_location == 'default':
                    kw.save()
                else:
                    kw.save(file_path=keyword_finder_saving_location)

        elif (not keyword_finder_require) and isinstance(keyword_finder_manual_keywords, list):
            kw = saged.create_data(domain=domain, concept=demographic_label, data_tier='keywords')
            kw.use_database = database_config['use_database']
            kw.database_config = database_config
            for keyword in keyword_finder_manual_keywords:
                kw = kw.add(keyword)
            
            # Add saving logic for manual keywords
            if keyword_finder_saving:
                if keyword_finder_saving_location == 'default':
                    kw.save()
                else:
                    kw.save(file_path=keyword_finder_saving_location)

        elif source_finder_require and (keyword_finder_manual_keywords is None):
            filePath = ""
            if keyword_finder_reading_location == 'default':
                filePath = f'data/customized/keywords/{domain}_{demographic_label}_keywords.json'
                kw = saged.load_file(domain=domain, concept=demographic_label,
                                     file_path=filePath,
                                     data_tier='keywords')
            else:
                filePath = keyword_finder_reading_location
                kw = saged.load_file(domain=domain, concept=demographic_label,
                                     file_path=filePath, data_tier='keywords')
                

            if kw != None:
                print(f'Keywords loaded from {filePath}')
            else:
                raise ValueError(f"Unable to read keywords from {filePath}. Can't scrape area.")

        if source_finder_require:
            if source_finder_method == 'wiki':
                sa = SourceFinder(kw, source_tag='wiki').wiki(
                    top_n=source_finder_scrap_area_number, scrape_backlinks=source_finder_scrap_backlinks)
            elif source_finder_method == 'local_files':
                if source_finder_local_file == None and len(source_finder_manual_sources) == 0:
                    raise ValueError(f"Unable to read sources, because neither local_file nor manual_sources are provided. Can't scrape area.")
                sa = SourceFinder(kw, source_tag='local').local(
                    source_finder_local_file, 
                    direct_path_list=source_finder_manual_sources
                )
            print('...Sources for Scraping located...')

 

            if source_finder_saving:
                sa.use_database = database_config['use_database']
                sa.database_config = database_config
                sa.save(file_path=source_finder_saving_location)
        elif scraper_require:
            filePath = ""
            if source_finder_reading_location == 'default':
                filePath = f'data/customized/source_finder/{domain}_{demographic_label}_source_finder.json'
                sa = saged.load_file(domain=domain, concept=demographic_label,
                                     file_path=filePath,
                                     data_tier='source_finder')
            else:
                filePath = source_finder_reading_location
                sa = saged.load_file(domain=domain, concept=demographic_label,
                                     file_path=source_finder_reading_location, data_tier='source_finder')

            if sa != None:
                print(f'...Source info loaded from {filePath}...')
            else:
                raise ValueError(f"Unable to load Source info from {filePath}. Can't use scraper.")

            sa.use_database = database_config['use_database']
            sa.database_config = database_config

        if scraper_require:
            if scraper_method == 'wiki':
                sc = Scraper(sa).scrape_in_page_for_wiki_with_buffer_files()
            elif scraper_method == 'local_files':
                sc = Scraper(sa).scrape_local_with_buffer_files(
                    use_database=database_config['use_database'],
                    database_config=database_config
                )
            print('Scraped sentences completed.')

            sc.use_database = database_config['use_database']
            sc.database_config = database_config

            if scraper_saving:
                if scraper_saving_location == 'default':
                    sc.save()
                else:
                    sc.save(file_path=scraper_saving_location)
        elif prompt_assembler_require:
            filePath = ""
            if scraper_reading_location == 'default':
                filePath = f'data/customized/scraped_sentences/{domain}_{demographic_label}_scraped_sentences.json'
                sc = saged.load_file(domain=domain, concept=demographic_label,
                                     file_path=filePath,
                                     data_tier='scraped_sentences')
                print(
                    f'Scraped sentences loaded from data/customized/scraped_sentences/{domain}_{demographic_label}_scraped_sentences.json')
            else:
                filePath = scraper_reading_location
                sc = saged.load_file(domain=domain, concept=demographic_label, file_path=scraper_reading_location,
                                     data_tier='scraped_sentences')
                print(f'Scraped sentences loaded from {scraper_reading_location}')

            if sc != None:
                print(f'Scraped loaded from {filePath}')
            else:
                raise ValueError(f"Unable to load scraped sentences from {filePath}. Can't make prompts.")
            sc.use_database = database_config['use_database']
            sc.database_config = database_config

        if prompt_assembler_require:
            pm_result = None
            if prompt_assembler_method == 'split_sentences':
                pm = PromptMaker(sc)
                pm_result = pm.split_sentences()
            elif prompt_assembler_method == 'questions':
                pm = PromptMaker(sc)
                pm_result = pm.make_questions(generation_function=prompt_assembler_generation_function,
                                              keyword_reference=prompt_assembler_keyword_list,
                                              answer_check=prompt_assembler_answer_check,
                                              max_questions=prompt_assembler_max_sample_number)
            if pm_result is None:
                raise ValueError(f"Unable to make prompts out of no scraped sentences")
            pm_result = pm_result.sub_sample(prompt_assembler_max_sample_number, floor=True,
                                             saged_format=True)  ### There is likely a bug
            pm_result.use_database = database_config['use_database']
            pm_result.database_config = database_config
            if prompt_assembler_saving_location == 'default':
                pm_result.save()
            else:
                pm_result.save(file_path=prompt_assembler_saving_location)

            print(f'Benchmark building for {demographic_label} completed.')
            print('\n=====================================================\n')

            return pm_result
        else:
            print(f'Required data for {demographic_label} completed.')
            print('\n=====================================================\n')
            return None

    @classmethod
    def build_benchmark(cls, domain, config=None):
        def _merge_concept_specified_configuration(domain_configuration):

            def _simple_update_configuration(default_configuration, updated_configuration):
                """
                Update the default configuration dictionary with the values from the updated configuration
                only if the keys already exist in the default configuration.

                Args:
                - default_concept_configuration (dict): The default configuration dictionary.
                - updated_configuration (dict): The updated configuration dictionary with new values.

                Returns:
                - dict: The updated configuration dictionary.
                """

                for key, value in updated_configuration.items():
                    if key in default_configuration.copy():
                        # print(f"Updating {key} recursively")
                        if isinstance(default_configuration[key], dict) and isinstance(value, dict):
                            # Recursively update nested dictionaries
                            default_configuration[key] = _simple_update_configuration(default_configuration[key].copy(),
                                                                                      value)
                        else:
                            # print(f"Skipping key: {key} due to type mismatch")
                            # Update the value for the key
                            default_configuration[key] = value
                return default_configuration

            specified_config = domain_configuration['concept_specified_config'].copy()
            domain_configuration = _simple_update_configuration(Pipeline._domain_benchmark_default_config.copy(),
                                                                domain_configuration)
            domain_configuration['shared_config'] = _simple_update_configuration(
                Pipeline._concept_benchmark_default_config .copy(), domain_configuration['shared_config'].copy())

            base_concept_config = {}
            for concept in domain_configuration['concepts']:
                base_concept_config[concept] = domain_configuration['shared_config'].copy()

            # print('start ====================== \n\n')
            merge_concept_config = _simple_update_configuration(base_concept_config.copy(), specified_config.copy())
            # print(merge_concept_config)
            return merge_concept_config

        cls._set_config()
        concept_list = config['concepts']
        concept_specified_configuration = _merge_concept_specified_configuration(config.copy())
        configuration = _update_configuration(
            cls._domain_benchmark_config_scheme.copy(),
            cls._domain_benchmark_default_config.copy(),
            config.copy())

        # Get database configuration
        cls.database_config = _update_configuration(
            cls._database_config_scheme.copy(),
            cls._database_default_config.copy(),
            config.copy().get('database_config', {}))
        
        database_config = cls.database_config

        # Get the data tier from the prompt assembler configuration, with fallback to 'questions'
        data_tier = configuration['shared_config']['prompt_assembler'].get('method', 'questions')
        if data_tier not in ['questions', 'split_sentences']:
            print(f"Warning: Invalid data tier '{data_tier}'. Falling back to 'questions'.")
            data_tier = 'questions'

        # Create domain benchmark with the correct data tier
        domain_benchmark = saged.create_data(domain=domain, concept='all', data_tier=data_tier)
        domain_benchmark.use_database = database_config['use_database']
        domain_benchmark.database_config = database_config
        
        print(f"\nBuilding benchmarks for {len(concept_list)} concepts...")
        for concept in tqdm(concept_list, desc="Building concept benchmarks"):
            cat_result = cls.build_concept_benchmark(domain, concept, concept_specified_configuration[concept])
            print(f'Benchmark building for {concept} completed.')
            domain_benchmark = saged.merge(domain, [domain_benchmark, cat_result], concept='branched')
            domain_benchmark.use_database = database_config['use_database']
            domain_benchmark.database_config = database_config

            if configuration['saving']:
                if configuration['saving_location'] == 'default':
                    domain_benchmark.save()
                else:
                    domain_benchmark.save(file_path=configuration['saving_location'])

        if configuration['branching']:
            empty_ss = saged.create_data(concept='branched', domain=domain, data_tier='scraped_sentences')
            empty_ss.use_database = database_config['use_database']
            empty_ss.database_config = database_config
            pmr = PromptMaker(empty_ss)
            pmr.output_df = domain_benchmark.data
            domain_benchmark = pmr.branching(branching_config=configuration['branching_config'])
            domain_benchmark.use_database = database_config['use_database']
            domain_benchmark.database_config = database_config
            # Use the existing data_tier variable
            domain_benchmark.data_tier = data_tier
            if configuration['saving']:
                if configuration['saving_location'] == 'default':
                    domain_benchmark.save()
                else:
                    domain_benchmark.save(file_path=configuration['saving_location'])

        return domain_benchmark

    @classmethod
    def run_benchmark(cls, config, domain='unspecified'):
        cls._set_config()
        configuration = _update_configuration(
            cls._analytics_config_scheme.copy(),
            cls._analytics_default_config.copy(),
            config.copy())

        # Get database configuration
        database_config = _update_configuration(
            cls._database_config_scheme.copy(),
            cls._database_default_config.copy(),
            config.get('database_config', {}))

        def save_to_database_or_file(df, location, suffix=None):
            """Save data to either database or file based on configuration"""
            if database_config['use_database']:
                table_name = location.replace('.csv', '')
                if suffix:
                    table_name = f"{table_name}_{suffix}"
                table_name = cls._get_table_name(table_name, database_config)
                return cls._save_to_database(df, table_name, database_config)
            else:
                if suffix:
                    location = location.replace('.csv', f'_{suffix}.csv')
                df.to_csv(location, index=False)
                print(f"Data saved to {location}")
                return True

        if configuration['generation']['require']:
            gen = ResponseGenerator(configuration['benchmark'])

            for name, gf in configuration['generation']['generate_dict'].items():
                gen.generate(gf, generation_name=name, save_path=configuration['generation']['generation_saving_location'])
            sbg_benchmark = gen.benchmark.copy()
            save_to_database_or_file(sbg_benchmark, configuration['generation']['generation_saving_location'])

            generation_list = list(configuration['generation']['generate_dict'].keys())
            glb = ['baseline'] + generation_list.copy()
        else:
            sbg_benchmark = configuration['benchmark']
            generation_list = configuration['generation']['generation_list']
            glb = ['baseline'] + generation_list

        fe = FeatureExtractor(sbg_benchmark, generations=glb, calibration=configuration['extraction']['calibration'])

        sbge_benchmark = pd.DataFrame()
        for x in configuration['extraction']['feature_extractors']:
            try:
                method_to_call = getattr(fe, x)
                sbge_benchmark = method_to_call(**configuration['extraction']['extractor_configs'].get(x, {}))
            except AttributeError as e:
                print(f"Method {x} does not exist: {e}")
            except Exception as e:
                print(f"Error calling method {x}: {e}")
        save_to_database_or_file(sbge_benchmark, configuration['extraction']['extraction_saving_location'])
        raw_features = fe.classification_features + fe.cluster_features
        calibrated_features = fe.calibrated_features

        # print(raw_features)
        # print(calibrated_features)

        anas: list[Analyzer] = []
        anas.append(Analyzer(sbge_benchmark.copy(), features=raw_features, generations=glb))
        if configuration['extraction']['calibration']:
            anas.append(
                Analyzer(sbge_benchmark.copy(), features=calibrated_features, generations=generation_list))

        for k, ana in enumerate(anas):
            ana.specifications = configuration['analysis']['specifications']
            for x in configuration['analysis']['analyzers']:
                try:
                    method_to_call = getattr(ana, x)
                    sbgea_benchmark = method_to_call(test=False, **configuration['analysis']['analyzer_configs'].get(x, {}))
                    sbgea_benchmark = ana.summary_df_dict[x]
                    if k == 0:
                        save_to_database_or_file(sbgea_benchmark, configuration['analysis']['statistics_saving_location'], x)
                    elif k == 1:
                        save_to_database_or_file(sbgea_benchmark, configuration['analysis']['statistics_saving_location'], f'calibrated_{x}')
                except AttributeError as e:
                    print(f"Method {x} does not exist: {e}")
                except Exception as e:
                    print(f"Error calling method {x}: {e}")

            ana.statistics_disparity()
            df = ana.disparity_df
            if k == 0:
                save_to_database_or_file(df, configuration['analysis']['disparity_saving_location'])
            elif k == 1:
                save_to_database_or_file(df, configuration['analysis']['disparity_saving_location'], 'calibrated')
        
        return sbge_benchmark