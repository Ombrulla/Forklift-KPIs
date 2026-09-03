import os
from pymongo import MongoClient
from dotenv import load_dotenv
from config.logger import get_logger

logger = get_logger("db_connection")

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "forklift_kpi")

class Database:
    def __init__(self):
        try:
            self.client = MongoClient(MONGO_URI)
            self.db = self.client[DB_NAME]
            
            # Specific collections
            self.raw_data = self.db["raw_data"]
            self.daily_kpis = self.db["daily_kpis"]
            self.ai_results = self.db["ai_results"]
            
            logger.info(f"Successfully connected to MongoDB at {MONGO_URI}, DB: {DB_NAME}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e

db_instance = Database()
