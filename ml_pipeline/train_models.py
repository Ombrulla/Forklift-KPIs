import os
import sys
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.logger import get_logger
from ml_pipeline.prepare_dataset import prepare_dataset

logger = get_logger("ml_pipeline", "ml_training.log")
models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')

def train_models():
    logger.info("Starting ML model training...")
    
    result = prepare_dataset()
    if not result:
        return
    raw_df, X_scaled = result
    
    if len(X_scaled) < 10:
        logger.warning("Not enough data to train models properly. Need at least 10 records.")
        return
        
    # --- 1. Train Anomaly Detection (Isolation Forest) ---
    logger.info("Training Isolation Forest for Anomaly Detection...")
    iso_forest = IsolationForest(contamination=0.05, random_state=42)
    iso_forest.fit(X_scaled)
    
    anomaly_preds = iso_forest.predict(X_scaled)
    anomalies_count = (anomaly_preds == -1).sum()
    logger.info(f"Anomaly Detection complete. Flagged {anomalies_count}/{len(X_scaled)} records as anomalous.")
    
    joblib.dump(iso_forest, os.path.join(models_dir, 'anomaly_model.pkl'))
    
    # --- 2. Train Fleet Segmentation (K-Means Clustering) ---
    logger.info("Training K-Means for Usage-Pattern Clustering...")
    k = 3 # Low, Medium, High usage patterns
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    cluster_preds = kmeans.fit_predict(X_scaled)
    
    score = silhouette_score(X_scaled, cluster_preds)
    logger.info(f"Clustering complete. Silhouette Score: {score:.3f}")
    
    joblib.dump(kmeans, os.path.join(models_dir, 'clustering_model.pkl'))
    
    logger.info("All models trained and saved successfully.")

if __name__ == "__main__":
    train_models()
