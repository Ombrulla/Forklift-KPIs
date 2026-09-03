import os
import sys
import pandas as pd
from sklearn.preprocessing import StandardScaler
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.logger import get_logger
from config.db import db_instance

logger = get_logger("ml_pipeline", "ml_training.log")

def prepare_dataset():
    logger.info("Starting dataset preparation for ML models...")
    
    # 1. Fetch daily KPIs from MongoDB
    cursor = db_instance.daily_kpis.find({})
    data = list(cursor)
    
    if not data:
        logger.warning("No daily KPIs found. Run the data ingestion worker first.")
        return None
        
    df = pd.DataFrame(data)
    
    # Drop mongo _id
    if '_id' in df.columns:
        df = df.drop(columns=['_id'])
        
    logger.info(f"Loaded {len(df)} records from daily_kpis collection.")
    
    # 2. Select Features for Anomaly Detection and Clustering
    features = [
        'engine_hours_sum', 'battery_decline_rate', 'hydraulic_load_factor', 
        'steering_activity_index', 'normalized_battery_discharge', 
        'normalized_handbrake_misuse', 'rolling_idle_ratio_7d', 
        'duty_cycle_volatility_7d'
    ]
    
    # Ensure all columns exist
    for f in features:
        if f not in df.columns:
            logger.warning(f"Feature {f} not found, filling with 0")
            df[f] = 0
            
    X_raw = df[features].fillna(0)
    
    # 3. Normalization / Scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_raw)
    X_scaled_df = pd.DataFrame(X_scaled, columns=features)
    
    # Save the scaler for inference time
    import joblib
    models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(scaler, os.path.join(models_dir, 'scaler.pkl'))
    
    # Save prepared dataset to CSV for inspection/training
    output_path = os.path.join(models_dir, 'prepared_dataset.csv')
    df.to_csv(output_path, index=False)
    
    logger.info(f"Dataset preparation complete. Saved scaler and dataset to {models_dir}")
    return df, X_scaled_df

if __name__ == "__main__":
    prepare_dataset()
