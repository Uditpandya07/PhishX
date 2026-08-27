import os
import joblib
import logging
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

# Global singleton to hold the machine learning model in RAM
_cached_model = None

def get_ml_model():
    """
    Returns the loaded ML model instance.
    Loads it exactly once during the application lifecycle to prevent memory leaks.
    """
    global _cached_model
    if _cached_model is None:
        logger.info("Initializing and loading the ML model into memory...")
        model_path = settings.MODEL_PATH

        # If not absolute, resolve relative to the working directory
        if not os.path.isabs(model_path):
            model_path = os.path.join(os.getcwd(), model_path)

        if not os.path.exists(model_path):
            logger.error(f"Machine learning model not found at {model_path}")
            raise HTTPException(
                status_code=500,
                detail=f"Machine learning model not found at {model_path}"
            )

        # INTEGRITY CHECK — chunked read to avoid double-loading 19MB into RAM
        import hashlib
        sha256 = hashlib.sha256()
        with open(model_path, 'rb') as f:
            for chunk in iter(lambda: f.read(65536), b''):
                sha256.update(chunk)
        file_hash = sha256.hexdigest()

        if file_hash != settings.EXPECTED_MODEL_HASH:
            logger.critical(f"Model Integrity Violation! Expected={settings.EXPECTED_MODEL_HASH}, Found={file_hash}")
            if os.getenv("STRICT_MODEL_CHECK", "false").lower() == "true":
                raise HTTPException(status_code=500, detail="Security violation: ML model tampered.")

        try:
            _cached_model = joblib.load(model_path, mmap_mode='r')
            logger.info("ML model successfully loaded and cached in memory using mmap_mode='r'.")
        except Exception as e:
            logger.error(f"Failed to load ML model: {e}")
            raise HTTPException(status_code=500, detail="Failed to load ML model.")
            
    return _cached_model
