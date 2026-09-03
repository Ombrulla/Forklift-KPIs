from pymongo import MongoClient
import pandas as pd
from config.logger import logger

class DataIngestion:
    def __init__(self, uri="mongodb://localhost:27017/", db_name="entitiesDatabase", collection="entities"):
        logger.info(f"Initializing DataIngestion with DB: {db_name}, Collection: {collection}")
        self.client = MongoClient(uri)
        self.db = self.client[db_name]
        self.collection = self.db[collection]

    def fetch_data(self, limit=None):
        logger.info(f"Fetching data from MongoDB (limit={limit}).")
        cursor = self.collection.find({})
        if limit:
            cursor = cursor.limit(limit)
        
        data = list(cursor)
        if not data:
            logger.warning("No data retrieved from MongoDB.")
            return pd.DataFrame()
        logger.info(f"Successfully fetched {len(data)} records.")
        return pd.DataFrame(data)

    def fetch_new_data(self, last_ts=None):
        """Fetch records newer than last_ts for streaming."""
        query = {}
        if last_ts:
            query = {"ts": {"$gt": last_ts}}
            
        cursor = self.collection.find(query).sort("ts", 1)
        data = list(cursor)
        
        if not data:
            return pd.DataFrame()
        
        logger.info(f"Stream fetched {len(data)} new records.")
        return pd.DataFrame(data)

    def save_predictions(self, predictions_df, target_collection="live_predictions"):
        """Save production-grade prediction documents back to MongoDB."""
        if predictions_df is None or predictions_df.empty:
            return
            
        coll = self.db[target_collection]
        
        # Convert DataFrame rows to production-grade MongoDB documents
        records = []
        for _, row in predictions_df.iterrows():
            record = {
                "ts": row.name if 'date' not in row else row['date'],
                "models_applied": ["RandomForest_RUL", "IsolationForest_Anomaly"],
                "predictions": {
                    "rul_engine_hours": float(row.get('predicted_engine_hours', 0)),
                    "is_anomaly": bool(row.get('is_anomaly') == -1)
                },
                "kpis_snapshot": {
                    "engine_hours": float(row.get('engine_hours', 0)),
                    "battery_soc": float(row.get('battery_soc', 0)),
                    "idle_ratio": float(row.get('idle_ratio', 0))
                }
            }
            records.append(record)
            
        if records:
            coll.insert_many(records)
            logger.info(f"Pushed {len(records)} prediction documents to '{target_collection}' collection.")
