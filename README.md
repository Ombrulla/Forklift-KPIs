# Modular KPI Pipeline (MongoDB → KPIs → ML)

This project implements a modular, production-grade data pipeline for forklift KPI (Key Performance Indicator) calculation and machine learning modeling. It ingests raw telemetry data from MongoDB, calculates daily math/statistical KPIs (such as Engine Hours, Handbrake Misuse, and Fuel Efficiency), engineers predictive features, and trains machine learning models for Remaining Useful Life (RUL) regression and anomaly detection. 

The architecture is fully decoupled into **Batch Data Preparation**, **Offline Model Training**, and **Live Streaming Inference**.

## Project Structure

```
project/
│── config/
│    ├── tag_map.py        # UUID → Tag mapping dictionary
│    └── logger.py         # Centralized logging configuration
│── pipeline/
│    ├── ingestion.py      # MongoDB batch & live streaming ingestion
│    ├── aggregation.py    # Math/Statistical KPI aggregation (e.g., Idle, Misuse)
│    ├── features.py       # Feature engineering for ML
│    └── models.py         # ML/statistical model definitions
│── scripts/
│    ├── 01_prepare_dataset.py  # Batch process MongoDB data into CSV
│    ├── 02_train_models.py     # Offline ML training and evaluation
│    └── 03_live_stream.py      # Live MongoDB streaming and inference daemon
│── dataset/               # Auto-generated folder for saved CSV datasets
│── models/                # Auto-generated folder for saved .joblib ML models
│── logs/                  # Auto-generated folder containing pipeline.log
```

## Prerequisites

- **Python 3.7+**
- **MongoDB**: A running MongoDB instance (by default, `mongodb://localhost:27017/`). Ensure you have the `entitiesDatabase` database and `entities` collection populated with raw telemetry data.

## Installation

1. Open your terminal or command prompt.
2. Navigate to the project directory:
   ```bash
   cd path/to/forklift-kpi
   ```
3. Install the required Python packages:
   ```bash
   pip install pandas pymongo scikit-learn joblib
   ```

## Configuration

- **Database Credentials**: If your MongoDB instance is hosted elsewhere or uses different credentials, update the connection parameters in `pipeline/ingestion.py`.
- **Telemetry Mapping**: Open `config/tag_map.py` and ensure the UUIDs match the telemetry fields flowing from your specific devices into MongoDB.

## Running the Pipeline

The system is decoupled into three distinct lifecycle phases. Run them in order:

### 1. Batch Data Preparation
Extracts all historical data, applies Math/Statistical KPI aggregation, engineers features, and flattens the output into a highly optimized CSV file.
```bash
python scripts/01_prepare_dataset.py
```
*Output: Creates `dataset/enriched_kpis.csv`.*

### 2. Offline Model Training
Loads the flat CSV dataset (bypassing MongoDB) to rapidly train, fine-tune, and evaluate the ML algorithms (RandomForestRegressor for RUL and IsolationForest for Anomalies).
```bash
python scripts/02_train_models.py
```
*Output: Evaluates accuracy metrics (MAE, R2) and saves trained algorithms to `models/rul_model.joblib` and `models/anomaly_model.joblib`.*

### 3. Live Streaming Inference
Runs continuously as a background service. It polls MongoDB every 5 seconds for new telemetry data, computes instantaneous math KPIs, runs the new data through the trained `.joblib` models, and pushes production-grade prediction documents back into your MongoDB `live_predictions` collection.
```bash
python scripts/03_live_stream.py
```
*Output: Streams live RUL and Anomaly predictions directly into MongoDB.*

## Monitoring & Logs
All actions, background polling, and errors are automatically logged to both your console and a persistent file at `logs/pipeline.log`.
