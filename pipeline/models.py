from sklearn.ensemble import RandomForestRegressor, IsolationForest
from config.logger import logger

class KPIModels:
    def train_rul_model(self, X, y):
        logger.info(f"Training RUL model (RandomForestRegressor) with {len(X)} samples.")
        model = RandomForestRegressor()
        model.fit(X, y)
        logger.info("RUL model training complete.")
        return model

    def train_anomaly_model(self, X):
        logger.info(f"Training Anomaly Detection model (IsolationForest) with {len(X)} samples.")
        model = IsolationForest()
        model.fit(X)
        logger.info("Anomaly detection model training complete.")
        return model
