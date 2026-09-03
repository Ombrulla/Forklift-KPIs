from config.logger import logger

class FeatureEngineer:
    def add_features(self, daily_kpis):
        logger.info("Starting feature engineering on daily KPIs.")
        daily_kpis['battery_soc_change'] = daily_kpis['battery_soc']['mean'].diff()
        daily_kpis['rolling_engine_hours'] = daily_kpis['engine_hours'].rolling(7).mean()
        daily_kpis['idle_ratio'] = daily_kpis['idle'] / (daily_kpis['engine_hours'] + 1)
        logger.info("Successfully engineered advanced features.")
        return daily_kpis
