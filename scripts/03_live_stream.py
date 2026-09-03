import sys
import os
import time
import joblib
import pandas as pd
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.ingestion import DataIngestion
from pipeline.aggregation import KPIAggregator
from pipeline.features import FeatureEngineer
import config.tag_map as tag_map
from config.logger import logger

def run_live_stream(poll_interval=5):
    logger.info(f"--- Starting Live Stream Inference (Polling every {poll_interval}s) ---")
    
    models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
    try:
        rul_model = joblib.load(os.path.join(models_dir, 'rul_model.joblib'))
        anomaly_model = joblib.load(os.path.join(models_dir, 'anomaly_model.joblib'))
    except FileNotFoundError:
        logger.error("Trained models not found. Run 02_train_models.py first.")
        return

    ingestor = DataIngestion()
    aggregator = KPIAggregator(tag_map)
    featurizer = FeatureEngineer()

    last_ts = None

    while True:
        try:
            logger.info("Polling MongoDB for new data...")
            new_data = ingestor.fetch_new_data(last_ts)
            
            if not new_data.empty:
                # Update last seen timestamp
                last_ts = new_data['ts'].max()
                
                # Instantly aggregate new batch (simulating live daily/hourly updates)
                live_kpis = aggregator.aggregate_daily(new_data)
                
                if not live_kpis.empty:
                    enriched_kpis = featurizer.add_features(live_kpis)
                    
                    # Fill NaN features for ML compatibility on small batches
                    X = enriched_kpis[['engine_hours', 'battery_soc_change', 'idle_ratio', 'oil_pressure_var']].fillna(0)
                    
                    # Predict
                    enriched_kpis['predicted_engine_hours'] = rul_model.predict(X)
                    enriched_kpis['is_anomaly'] = anomaly_model.predict(X)
                    
                    # Push back to Mongo
                    ingestor.save_predictions(enriched_kpis)
                    logger.info("Live prediction cycle complete.")
            
            time.sleep(poll_interval)
            
        except KeyboardInterrupt:
            logger.info("Live streaming stopped by user.")
            break
        except Exception as e:
            logger.error(f"Error in live stream loop: {e}")
            time.sleep(poll_interval)

if __name__ == "__main__":
    run_live_stream()
