import os
import requests
import time
import logging
import re
from typing import Optional, Union

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def call_gpt4o_score(input_text: str, candidate: str, reference: str, max_retries: int = 3, timeout: int = 30) -> Optional[float]:
    """Call GPT-4o to score grammar correction with error handling and retry logic."""
    
    # Handle None inputs
    if candidate is None:
        logger.warning("Candidate is None, returning score 0.0")
        return 0.0
    
    prompt = f"""
Input sentence: "{input_text}"
Candidate correction: "{candidate}"
Reference correction: "{reference}"

Evaluate the candidate's correction. Score from 0.0 to 1.0 where:
- 1.0 = perfectly correct and matches reference
- 0.8–0.9 = minor rewording, still grammatically perfect
- 0.6–0.7 = contains partial fixes
- 0.3–0.5 = grammatically poor or missing key changes
- 0.0–0.2 = irrelevant or completely wrong

Reply only with a number between 0.0 and 1.0.
""".strip()

    # Validate environment variables
    api_url = os.getenv('AZURE_API_URL')
    api_key = os.getenv('AZURE_API_KEY')
    
    if not api_url or not api_key:
        logger.error("Missing Azure API credentials in environment variables")
        return None
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Calling GPT-4o for scoring (attempt {attempt + 1}/{max_retries})")
            
            # Use api-key header instead of Bearer token for Azure
            headers = {
                "Content-Type": "application/json",
                "api-key": api_key
            }
            
            response = requests.post(
                f"{api_url}/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-01",
                headers=headers,
                json={
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 10,
                    "temperature": 0,
                },
                timeout=timeout
            )
            
            # Check if request was successful
            response.raise_for_status()
            
            # Parse response
            response_data = response.json()
            
            # Validate response structure
            if "choices" not in response_data or len(response_data["choices"]) == 0:
                logger.error(f"Invalid response structure: {response_data}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                else:
                    return None
            
            content = response_data["choices"][0]["message"]["content"].strip()
            
            # Extract score using regex to handle potential extra text
            score_match = re.search(r'(\d+\.?\d*)', content)
            if score_match:
                score = float(score_match.group(1))
                # Ensure score is within valid range
                score = max(0.0, min(1.0, score))
                logger.info(f"Successfully received score: {score}")
                return score
            else:
                logger.error(f"Could not extract score from response: {content}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                else:
                    return None
                    
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
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
