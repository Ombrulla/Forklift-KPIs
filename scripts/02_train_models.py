import sys
import os
import joblib
import pandas as pd
from datetime import datetime
from sklearn.metrics import mean_absolute_error, r2_score
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.models import KPIModels
from config.logger import logger

def run_model_training():
    logger.info("--- Starting Offline Model Training ---")
    
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dataset', 'enriched_kpis.csv')
    
    if not os.path.exists(dataset_path):
        logger.error(f"Dataset not found at {dataset_path}. Please run 01_prepare_dataset.py first.")
        return
        
    enriched_kpis = pd.read_csv(dataset_path, index_col=0) # 'date' is index
    
    # Pre-process
    X = enriched_kpis[['engine_hours', 'battery_soc_change', 'idle_ratio', 'oil_pressure_var']].dropna()
    if X.empty:
        logger.error("Not enough data to train models.")
        return
        
    y = enriched_kpis.loc[X.index, 'engine_hours']

    models = KPIModels()
    
    # Train
    rul_model = models.train_rul_model(X, y)
    anomaly_model = models.train_anomaly_model(X)

    # Evaluate
    rul_preds = rul_model.predict(X)
    anomaly_preds = anomaly_model.predict(X)
    
    mae = mean_absolute_error(y, rul_preds)
    r2 = r2_score(y, rul_preds)
    anomalies_count = (anomaly_preds == -1).sum()
    
    logger.info(f"RUL Model Evaluation -> MAE: {mae:.2f}, R2: {r2:.2f}")
    logger.info(f"Anomaly Detection -> Found {anomalies_count} anomalies out of {len(X)} samples")

    # Save Models with Versioning
    models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    rul_path = os.path.join(models_dir, f'rul_model_{timestamp}.joblib')
    anomaly_path = os.path.join(models_dir, f'anomaly_model_{timestamp}.joblib')
    
    joblib.dump(rul_model, rul_path)
    joblib.dump(anomaly_model, anomaly_path)
    logger.info(f"Models successfully saved as {rul_path} and {anomaly_path}")

if __name__ == "__main__":
    run_model_training()
