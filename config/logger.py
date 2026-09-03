import logging
import os

def get_logger(name="forklift_kpi", log_file="pipeline.log"):
    logger = logging.getLogger(name)
    # Prevent adding multiple handlers if setup is called multiple times
    if not logger.hasHandlers():
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

        # Console handler
        ch = logging.StreamHandler()
        ch.setFormatter(formatter)
        logger.addHandler(ch)

        # File handler
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
            
        fh = logging.FileHandler(os.path.join(log_dir, log_file))
        fh.setFormatter(formatter)
        logger.addHandler(fh)

    return logger

# Default logger for legacy support, but new code should call get_logger("service_name", "filename.log")
logger = get_logger()

