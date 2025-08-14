import requests
import time
import logging
from typing import Optional, Dict, Any
import json
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CustomLLMHandler:
    def __init__(self, endpoint_url: str, model_name: str = "default", api_key: str = None, 
                 endpoint_type: str = "ollama", max_retries: int = 3, timeout: int = 30):
        self.endpoint_url = endpoint_url
        self.model_name = model_name
        self.api_key = api_key
        self.endpoint_type = endpoint_type
        self.max_retries = max_retries
        self.timeout = timeout
    
    def clean_response(self, response: str) -> str:
        """Clean the response by removing think sections and unwanted formatting."""
        if not response:
            return response
        
        # Remove <think> tags and their content
        response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove thinking patterns
        response = re.sub(r'\*\*thinking\*\*.*?\*\*end thinking\*\*', '', response, flags=re.DOTALL | re.IGNORECASE)
        response = re.sub(r'\*thinking\*.*?\*end thinking\*', '', response, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove common thinking phrases
        thinking_patterns = [
            r'Let me think about this.*?\n',
            r'I need to.*?\n',
            r'The original sentence.*?\n',
            r'Looking at this.*?\n',
            r'First, I.*?\n',
            r'First,.*?\n',
            r'So the corrected.*?\n',
            r'Therefore.*?\n',
            r'I can see.*?\n',
            r'This sentence.*?\n',
            r'The sentence.*?\n',
        ]
        
        for pattern in thinking_patterns:
            response = re.sub(pattern, '', response, flags=re.IGNORECASE)
        
        # Clean up extra whitespace and newlines
        response = re.sub(r'\n\s*\n', '\n', response)
        response = response.strip()
        
        # If the response contains multiple lines, try to get the actual correction
        lines = response.split('\n')
        if len(lines) > 1:
            # Look for the corrected sentence (usually the last non-empty line)
            for line in reversed(lines):
                line = line.strip()
                if line and not line.startswith(('The', 'This', 'So', 'Therefore', 'Looking', 'First')):
                    return line
        
        return response
    
    def call_llm(self, prompt: str) -> Optional[str]:
        """Call the LLM with error handling and retry logic."""
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Calling {self.endpoint_type} model (attempt {attempt + 1}/{self.max_retries})")
                
                if self.endpoint_type == "ollama":
                    return self._call_ollama(prompt)
                elif self.endpoint_type == "openai":
                    return self._call_openai_compatible(prompt)
                elif self.endpoint_type == "custom":
                    return self._call_custom(prompt)
                else:
                    logger.error(f"Unsupported endpoint type: {self.endpoint_type}")
                    return None
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"Request failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    logger.error("Max retries reached, returning None")
                    return None
            except Exception as e:
                logger.error(f"Unexpected error (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    logger.error("Max retries reached, returning None")
                    return None
        
        return None
    
    def _call_ollama(self, prompt: str) -> Optional[str]:
        """Call Ollama API."""
        response = requests.post(
            self.endpoint_url,
            json={"model": self.model_name, "prompt": prompt, "stream": False},
            timeout=self.timeout
        )
        
        response.raise_for_status()
        response_data = response.json()
        
        if "response" not in response_data:
            logger.error(f"Invalid response structure: {response_data}")
            return None
        
        result = response_data["response"].strip()
        cleaned_result = self.clean_response(result)
        logger.info(f"Successfully received response from Ollama: {cleaned_result}")
        return cleaned_result
    
    def _call_openai_compatible(self, prompt: str) -> Optional[str]:
        """Call OpenAI-compatible API."""
        headers = {
            "Content-Type": "application/json",
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 150,
            "temperature": 0.7
        }
        
        response = requests.post(
            self.endpoint_url,
            headers=headers,
            json=payload,
            timeout=self.timeout
        )
        
        response.raise_for_status()
        response_data = response.json()
        
        if "choices" not in response_data or len(response_data["choices"]) == 0:
            logger.error(f"Invalid response structure: {response_data}")
            return None
        
        result = response_data["choices"][0]["message"]["content"].strip()
        cleaned_result = self.clean_response(result)
        logger.info(f"Successfully received response from OpenAI-compatible API: {cleaned_result}")
        return cleaned_result
    
    def _call_custom(self, prompt: str) -> Optional[str]:
        """Call custom API - this is a template that can be customized."""
        headers = {
            "Content-Type": "application/json",
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        # This is a generic payload - customize as needed
        payload = {
            "prompt": prompt,
            "model": self.model_name,
            "max_tokens": 150
        }
        
        response = requests.post(
            self.endpoint_url,
            headers=headers,
            json=payload,
            timeout=self.timeout
        )
        
        response.raise_for_status()
        response_data = response.json()
        
        # Customize this based on your API's response format
        if "response" in response_data:
            result = response_data["response"].strip()
        elif "text" in response_data:
            result = response_data["text"].strip()
        elif "output" in response_data:
            result = response_data["output"].strip()
        else:
            logger.error(f"Unknown response format: {response_data}")
            return None
        
        cleaned_result = self.clean_response(result)
        logger.info(f"Successfully received response from custom API: {cleaned_result}")
        return cleaned_result

def test_connection(endpoint_url: str, model_name: str = "default", api_key: str = "None", 
                   endpoint_type: str = "ollama") -> bool:
    """Test connection to LLM endpoint."""
    handler = CustomLLMHandler(endpoint_url, model_name, api_key, endpoint_type)
    
    try:
        response = handler.call_llm("Hello, this is a test.")
        return response is not None
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        return False
