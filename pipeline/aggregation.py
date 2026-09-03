import pandas as pd
from config.logger import get_logger

logger = get_logger("data_pipeline", "data_pipeline.log")

class KPIAggregator:
    def __init__(self, tag_map):
        self.tag_map = tag_map.TAG_MAP if hasattr(tag_map, 'TAG_MAP') else {}

    def _get_val(self, data, tag, default=0):
        uuid = self.tag_map.get(tag, tag)
        return data.get(uuid, {}).get("value", default)

    def compute_kpis(self, row):
        data = row.get('data', {})
        
        def get(tag): return self._get_val(data, tag, 0)
        def get_str(tag): return str(self._get_val(data, tag, "0"))
            
        forward = get_str("forward_movement") == "1"
        backward = get_str("backward_movement") == "1"
        ignition = get_str("ssf_ignition") == "1"
        handbrake = get_str("handbrake_activity") == "1"
        steering = get_str("steering_function") == "1"
        
        return {
            "device_id": row.get("device_id", "unknown"),
            "date": row['ts'].date() if pd.notnull(row.get('ts')) else None,
            "engine_hours": float(get("engine_worktime")),
            "battery_soc": float(get("state_of_charge")),
            "hydraulic_usage": 1 if get_str("hydraulic_function") == "1" else 0,
            "traction_usage": 1 if (forward or backward) else 0,
            "idle": 1 if (ignition and not forward and not backward) else 0,
            "handbrake_active": 1 if handbrake else 0,
            "handbrake_misuse": 1 if (handbrake and (forward or backward)) else 0,
            "steering_active": 1 if steering else 0
        }

    def aggregate_daily(self, df):
        logger.info("Starting daily KPI aggregation.")
        if df is None or df.empty:
            logger.warning("Data is empty. Returning empty DataFrame.")
            return pd.DataFrame()
            
        logger.info(f"Processing {len(df)} rows to compute base KPIs.")
        kpi_df = pd.DataFrame([self.compute_kpis(row) for _, row in df.iterrows()])
        
        if kpi_df.empty:
            logger.warning("KPI computation resulted in empty DataFrame.")
            return pd.DataFrame()
            
        # We need steering transitions 0->1 for Steering Activity Index.
        # This requires sorting by time per device. Assuming df is already sorted by ts.
        kpi_df['steering_transition'] = (kpi_df['steering_active'] > kpi_df.groupby('device_id')['steering_active'].shift(1, fill_value=0)).astype(int)

        logger.info("Grouping KPIs by date and device_id.")
        # Aggregate base metrics
        aggregated = kpi_df.groupby(["device_id", "date"]).agg({
            "engine_hours": "sum",
            "battery_soc": ["mean", "min", "max"],
            "hydraulic_usage": "sum",
            "traction_usage": "sum",
            "idle": "sum",
            "handbrake_active": "sum",
            "handbrake_misuse": "sum",
            "steering_transition": "sum"
        })
        
        # Flatten multi-level columns
        aggregated.columns = ['_'.join(col).strip('_') for col in aggregated.columns.values]
        aggregated = aggregated.reset_index()
        
        # Sort values to safely apply rolling/diff functions per device
        aggregated = aggregated.sort_values(by=["device_id", "date"])
        
        # --- Derived KPIs ---
        # 3. Battery Decline Rate
        aggregated['battery_decline_rate'] = aggregated.groupby('device_id')['battery_soc_mean'].diff().fillna(0)
        
        # 9. Hydraulic Load Factor (avoid divide by zero)
        aggregated['hydraulic_load_factor'] = aggregated['hydraulic_usage_sum'] / aggregated['traction_usage_sum'].replace(0, pd.NA)
        aggregated['hydraulic_load_factor'] = aggregated['hydraulic_load_factor'].fillna(0)
        
        # 11. Steering Activity Index
        aggregated['steering_activity_index'] = aggregated['steering_transition_sum'] / aggregated['traction_usage_sum'].replace(0, pd.NA)
        aggregated['steering_activity_index'] = aggregated['steering_activity_index'].fillna(0)
        
        # 13. Normalized Battery Discharge Rate
        aggregated['normalized_battery_discharge'] = aggregated['battery_decline_rate'].abs() / aggregated['engine_hours_sum'].replace(0, pd.NA)
        aggregated['normalized_battery_discharge'] = aggregated['normalized_battery_discharge'].fillna(0)
        
        # 14. Normalized Handbrake Misuse Rate
        aggregated['normalized_handbrake_misuse'] = aggregated['handbrake_misuse_sum'] / aggregated['traction_usage_sum'].replace(0, pd.NA)
        aggregated['normalized_handbrake_misuse'] = aggregated['normalized_handbrake_misuse'].fillna(0)
        
        # 12 & 15. Rolling Idle Ratio Trend & Duty-Cycle Volatility (7-day window)
        aggregated['idle_ratio'] = aggregated['idle_sum'] / aggregated['engine_hours_sum'].replace(0, pd.NA)
        aggregated['idle_ratio'] = aggregated['idle_ratio'].fillna(0)
        
        aggregated['rolling_idle_ratio_7d'] = aggregated.groupby('device_id')['idle_ratio'].transform(lambda x: x.rolling(7, min_periods=1).mean())
        aggregated['duty_cycle_volatility_7d'] = aggregated.groupby('device_id')['engine_hours_sum'].transform(lambda x: x.rolling(7, min_periods=1).std().fillna(0))

        logger.info(f"Aggregated data into {len(aggregated)} daily records with derived KPIs.")
        return aggregated

