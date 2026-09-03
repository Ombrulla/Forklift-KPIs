import sys
import os
import time
import pandas as pd
import joblib
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.aggregation import KPIAggregator
import config.tag_map as tag_map
from config.logger import get_logger
from config.db import db_instance

logger = get_logger("data_pipeline", "data_pipeline.log")

def run_data_worker(poll_interval=10):
    logger.info(f"--- Starting Data Ingestion Worker (Polling every {poll_interval}s) ---")
    
    aggregator = KPIAggregator(tag_map)
    last_ts = None
    
    models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
    try:
        scaler = joblib.load(os.path.join(models_dir, 'scaler.pkl'))
        iso_forest = joblib.load(os.path.join(models_dir, 'anomaly_model.pkl'))
        kmeans = joblib.load(os.path.join(models_dir, 'clustering_model.pkl'))
        ml_enabled = True
        logger.info("ML models loaded successfully for inference.")
    except Exception as e:
        ml_enabled = False
        logger.warning(f"ML models not found or failed to load. Running without ML inference: {e}")

    while True:
        try:
            logger.info("Polling MongoDB (raw_data) for new data...")
            query = {"ts": {"$gt": last_ts}} if last_ts else {}
            
            cursor = db_instance.raw_data.find(query).sort("ts", 1).limit(5000)
            data = list(cursor)
            
            if data:
                logger.info(f"Worker fetched {len(data)} new raw records.")
                df = pd.DataFrame(data)
                
                last_ts = df['ts'].max()
                
                daily_kpis_df = aggregator.aggregate_daily(df)
                
                if not daily_kpis_df.empty:
                    records = daily_kpis_df.to_dict("records")
                    
                    import math
                    for r in records:
                        for k, v in r.items():
                            if isinstance(v, float) and math.isnan(v):
                                r[k] = None
                                
                    if records:
                        db_instance.daily_kpis.insert_many(records)
                        logger.info(f"Saved {len(records)} daily KPI records to MongoDB.")
                        
                    # --- ML Inference Phase ---
                    if ml_enabled:
                        features = [
                            'engine_hours_sum', 'battery_decline_rate', 'hydraulic_load_factor', 
                            'steering_activity_index', 'normalized_battery_discharge', 
                            'normalized_handbrake_misuse', 'rolling_idle_ratio_7d', 
                            'duty_cycle_volatility_7d'
                        ]
                        
                        # Ensure columns exist and fill NaNs
                        for f in features:
                            if f not in daily_kpis_df.columns:
                                daily_kpis_df[f] = 0
                                
                        X_raw = daily_kpis_df[features].fillna(0)
                        
                        if not X_raw.empty:
                            X_scaled = scaler.transform(X_raw)
                            
                            anomalies = iso_forest.predict(X_scaled)
                            clusters = kmeans.predict(X_scaled)
                            
                            ai_records = []
                            for idx, row in daily_kpis_df.iterrows():
                                ai_record = {
                                    "device_id": row.get("device_id", "unknown"),
                                    "date": row.get("date"),
                                    "is_anomaly": bool(anomalies[idx] == -1),
                                    "usage_cluster": int(clusters[idx]),
                                    "features_snapshot": {f: float(row[f]) for f in features}
                                }
                                ai_records.append(ai_record)
                                
                            if ai_records:
                                db_instance.ai_results.insert_many(ai_records)
                                logger.info(f"Saved {len(ai_records)} AI inference records to MongoDB.")
            else:
                logger.debug("No new data found.")
            
            time.sleep(poll_interval)
            
        except KeyboardInterrupt:
            logger.info("Data worker stopped by user.")
            break
        except Exception as e:
            logger.error(f"Error in data worker loop: {e}")
            time.sleep(poll_interval)

if __name__ == "__main__":
    run_data_worker()
