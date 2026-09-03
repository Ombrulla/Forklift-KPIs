import sys
import os
import pandas as pd
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.ingestion import DataIngestion
from pipeline.aggregation import KPIAggregator
from pipeline.features import FeatureEngineer
from config.logger import logger
import config.tag_map as tag_map

def run_data_preparation():
    logger.info("--- Starting Batch Data Preparation ---")
    
    ingestor = DataIngestion()
    aggregator = KPIAggregator(tag_map)
    featurizer = FeatureEngineer()

    # 1. Fetch all data
    raw_df = ingestor.fetch_data()
    if raw_df.empty:
        logger.error("No data found in MongoDB to prepare dataset.")
        return

    # 2. Aggregate Daily
    daily_kpis = aggregator.aggregate_daily(raw_df)
    if daily_kpis.empty:
        logger.error("Failed to aggregate daily KPIs.")
        return

    # 3. Engineer Features
    enriched_kpis = featurizer.add_features(daily_kpis)

    # 4. Save to CSV
    dataset_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dataset')
    if not os.path.exists(dataset_dir):
        os.makedirs(dataset_dir)
        
    dataset_path = os.path.join(dataset_dir, 'enriched_kpis.csv')
    enriched_kpis.to_csv(dataset_path)
    logger.info(f"Dataset successfully prepared and saved to {dataset_path}")

if __name__ == "__main__":
    run_data_preparation()
