from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.db import db_instance
from config.logger import get_logger

logger = get_logger("fastapi_backend", "fastapi_backend.log")

app = FastAPI(title="Forklift KPI API", version="1.0")

# Setup CORS for the Next.js dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """Initialize DB with data if empty, so we don't need a separate worker script."""
    try:
        # Check if we already have daily_kpis
        if db_instance.daily_kpis.count_documents({}) == 0:
            logger.info("Database is empty! Automatically pulling data directly from entitiesDatabase (limit=10000) to populate KPIs...")
            
            from pipeline.ingestion import DataIngestion
            from pipeline.aggregation import KPIAggregator
            from pipeline.features import FeatureEngineer
            import config.tag_map as tag_map
            import pandas as pd
            import math
            import joblib
            
            ingestor = DataIngestion(db_name="entitiesDatabase", collection="entities")
            aggregator = KPIAggregator(tag_map)
            
            # Fetch a sample to avoid memory issues (10000 is usually enough for a dashboard demo)
            raw_df = ingestor.fetch_data(limit=10000)
            
            if not raw_df.empty:
                logger.info("Aggregating daily KPIs for startup...")
                daily_kpis_df = aggregator.aggregate_daily(raw_df)
                
                if not daily_kpis_df.empty:
                    records = daily_kpis_df.to_dict("records")
                    
                    import datetime
                    # clean NaN and convert date to datetime
                    for r in records:
                        for k, v in r.items():
                            if isinstance(v, float) and math.isnan(v):
                                r[k] = None
                            if isinstance(v, datetime.date) and not isinstance(v, datetime.datetime):
                                r[k] = datetime.datetime.combine(v, datetime.time.min)
                                
                    if records:
                        db_instance.daily_kpis.insert_many(records)
                        logger.info(f"Inserted {len(records)} daily KPI records on startup.")
                        
                    # Also populate AI results
                    models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
                    try:
                        scaler = joblib.load(os.path.join(models_dir, 'scaler.pkl'))
                        iso_forest = joblib.load(os.path.join(models_dir, 'anomaly_model.pkl'))
                        kmeans = joblib.load(os.path.join(models_dir, 'clustering_model.pkl'))
                        
                        features = [
                            'engine_hours_sum', 'battery_decline_rate', 'hydraulic_load_factor', 
                            'steering_activity_index', 'normalized_battery_discharge', 
                            'normalized_handbrake_misuse', 'rolling_idle_ratio_7d', 
                            'duty_cycle_volatility_7d'
                        ]
                        
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
                                date_val = row.get("date")
                                if isinstance(date_val, datetime.date) and not isinstance(date_val, datetime.datetime):
                                    date_val = datetime.datetime.combine(date_val, datetime.time.min)
                                
                                ai_record = {
                                    "device_id": row.get("device_id", "unknown"),
                                    "date": date_val,
                                    "is_anomaly": bool(anomalies[idx] == -1),
                                    "usage_cluster": int(clusters[idx]),
                                    "features_snapshot": {f: float(row[f]) for f in features}
                                }
                                ai_records.append(ai_record)
                                
                            if ai_records:
                                db_instance.ai_results.insert_many(ai_records)
                                logger.info(f"Inserted {len(ai_records)} AI results on startup.")
                    except Exception as ml_e:
                        logger.warning(f"Failed to generate AI results on startup: {ml_e}")
    except Exception as e:
        logger.error(f"Failed to initialize data on startup: {e}")

@app.get("/")
def read_root():
    return {"status": "Forklift KPI API is running"}

@app.get("/api/kpis/daily")
def get_daily_kpis(device_id: str = None, limit: int = 100):
    """Fetch daily aggregated KPIs."""
    try:
        query = {}
        if device_id:
            query["device_id"] = device_id
            
        cursor = db_instance.daily_kpis.find(query, {"_id": 0}).sort("date", -1).limit(limit)
        return {"data": list(cursor)}
    except Exception as e:
        logger.error(f"Error fetching daily KPIs: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/api/ml/ai_results")
def get_ai_results(device_id: str = None, limit: int = 100):
    """Fetch ML inferences and anomalies."""
    try:
        query = {}
        if device_id:
            query["device_id"] = device_id
            
        cursor = db_instance.ai_results.find(query, {"_id": 0}).sort("date", -1).limit(limit)
        return {"data": list(cursor)}
    except Exception as e:
        logger.error(f"Error fetching AI results: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/api/fleet/status")
def get_fleet_status():
    """Aggregated status for the dashboard overview."""
    try:
        # A simple aggregation for demonstration
        pipeline = [
            {"$sort": {"date": -1}},
            {"$group": {
                "_id": "$device_id",
                "latest_battery_soc": {"$first": "$battery_soc_mean"},
                "total_engine_hours": {"$sum": "$engine_hours_sum"},
                "total_traction_hours": {"$sum": "$traction_usage_sum"},
                "latest_date": {"$first": "$date"}
            }}
        ]
        results = list(db_instance.daily_kpis.aggregate(pipeline))
        
        # Format output
        for r in results:
            r["device_id"] = r.pop("_id")
            
        return {"data": results}
    except Exception as e:
        logger.error(f"Error fetching fleet status: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

if __name__ == "__main__":
    import uvicorn
    # Using the port specified in .env or default 8000
    port = int(os.getenv("FASTAPI_PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
