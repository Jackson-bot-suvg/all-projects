import requests
import time
import logging
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def call_qwen(prompt: str, model: str = "qwen3:0.6b", max_retries: int = 3, timeout: int = 30) -> Optional[str]:
    """Call Qwen model with error handling and retry logic."""
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Calling Qwen model (attempt {attempt + 1}/{max_retries})")
            
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={"model": model, "prompt": prompt, "stream": False},
                timeout=timeout
            )
            
            # Check if request was successful
            response.raise_for_status()
            
            # Parse response
            response_data = response.json()
            
            # Validate response structure
            if "response" not in response_data:
                logger.error(f"Invalid response structure: {response_data}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    continue
                else:
                    return None
            
            result = response_data["response"].strip()
            logger.info("Successfully received response from Qwen")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                logger.error("Max retries reached, returning None")
                return None
        except Exception as e:
            logger.error(f"Unexpected error (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                logger.error("Max retries reached, returning None")
                return None
    
    return None
