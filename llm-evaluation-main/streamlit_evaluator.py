import json
import os
import logging
import statistics
from datetime import datetime
from typing import List, Dict, Optional
from tqdm import tqdm
from dotenv import load_dotenv

from models.custom_llm import CustomLLMHandler
from models.azure_gpt_judge import call_gpt4o_score

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('outputs/evaluation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class StreamlitEvaluator:
    def __init__(self, llm_handler: CustomLLMHandler, task_prompt: str = None, evaluation_criteria: str = None):
        self.llm_handler = llm_handler
        self.task_prompt = task_prompt or "Process this input: {input_text}"
        self.evaluation_criteria = evaluation_criteria or self._get_default_criteria()
    
    def _get_default_criteria(self) -> str:
        """Get default evaluation criteria for general LLM evaluation."""
        return """
Evaluate the LLM response quality. Score from 0.0 to 1.0 where:
- 1.0 = Excellent response, perfectly addresses the task
- 0.8-0.9 = Good response, minor issues or improvements possible
- 0.6-0.7 = Adequate response, some issues or missing elements
- 0.4-0.5 = Poor response, significant issues or incomplete
- 0.0-0.3 = Inadequate response, fails to address the task

Consider factors like:
- Accuracy and correctness
- Completeness and thoroughness
- Clarity and coherence
- Relevance to the task
- Overall quality

Reply only with a number between 0.0 and 1.0."""
    
    def evaluate_sample(self, input_text: str, reference: str = None, task_type: str = "general") -> Dict:
        """Evaluate a single sample and return results."""
        result = {
            "input": input_text,
            "reference": reference,
            "candidate": None,
            "score": None,
            "success": False,
            "error": None,
            "task_type": task_type
        }
        
        try:
            # Generate prompt based on task type
            if task_type == "grammar_correction":
                prompt = f"Correct the grammar: {input_text}"
            elif task_type == "summarization":
                prompt = f"Summarize the following text: {input_text}"
            elif task_type == "translation":
                prompt = f"Translate the following text: {input_text}"
            elif task_type == "question_answering":
                prompt = f"Answer the following question: {input_text}"
            elif task_type == "text_completion":
                prompt = f"Complete the following text: {input_text}"
            elif task_type == "classification":
                prompt = f"Classify the following text: {input_text}"
            else:
                # Use custom task prompt or default
                prompt = self.task_prompt.format(input_text=input_text)
            
            # Get candidate response from custom LLM
            candidate = self.llm_handler.call_llm(prompt)
            result["candidate"] = candidate
            
            if candidate is None:
                result["error"] = "Failed to get candidate response"
                return result
            
            # Get score from GPT-4o judge
            if reference:
                score = self._score_with_reference(input_text, candidate, reference, task_type)
            else:
                score = self._score_without_reference(input_text, candidate, task_type)
            
            result["score"] = score
            
            if score is None:
                result["error"] = "Failed to get score"
                return result
            
            result["success"] = True
            return result
            
        except Exception as e:
            result["error"] = str(e)
            logger.error(f"Error evaluating sample: {e}")
            return result
    
    def _score_with_reference(self, input_text: str, candidate: str, reference: str, task_type: str) -> Optional[float]:
        """Score response with reference answer."""
        if task_type == "grammar_correction":
            return call_gpt4o_score(input_text, candidate, reference)
        
        # General scoring with reference
        prompt = f"""
Task: {task_type}
Input: "{input_text}"
Candidate Response: "{candidate}"
Reference Response: "{reference}"

{self.evaluation_criteria}

Compare the candidate response with the reference response."""
        
        return self._get_score_from_judge(prompt)
    
    def _score_without_reference(self, input_text: str, candidate: str, task_type: str) -> Optional[float]:
        """Score response without reference answer."""
        prompt = f"""
Task: {task_type}
Input: "{input_text}"
Candidate Response: "{candidate}"

{self.evaluation_criteria}

Evaluate the candidate response based on the task requirements."""
        
        return self._get_score_from_judge(prompt)
    
    def _get_score_from_judge(self, prompt: str) -> Optional[float]:
        """Get score from GPT-4o judge with custom prompt."""
        try:
            # Use the existing Azure GPT judge but with custom prompt
            import requests
            import os
            import re
            
            api_url = os.getenv('AZURE_API_URL')
            api_key = os.getenv('AZURE_API_KEY')
            
            if not api_url or not api_key:
                logger.error("Missing Azure API credentials")
                return None
            
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
                timeout=30
            )
            
            response.raise_for_status()
            response_data = response.json()
            
            if "choices" not in response_data or len(response_data["choices"]) == 0:
                logger.error(f"Invalid response structure: {response_data}")
                return None
            
            content = response_data["choices"][0]["message"]["content"].strip()
            
            # Extract score using regex
            score_match = re.search(r'(\d+\.?\d*)', content)
            if score_match:
                score = float(score_match.group(1))
                score = max(0.0, min(1.0, score))
                return score
            
            logger.error(f"Could not extract score from response: {content}")
            return None
            
        except Exception as e:
            logger.error(f"Error getting score from judge: {e}")
            return None
    
    def evaluate_dataset(self, samples: List[Dict], task_type: str = "general", progress_callback=None) -> tuple:
        """Evaluate a list of samples and return results and metrics."""
        results = []
        
        for i, sample in enumerate(samples):
            if progress_callback:
                progress_callback(i, len(samples), sample.get("input", ""))
            
            input_text = sample.get("input", "")
            reference = sample.get("ideal", sample.get("reference", sample.get("expected", "")))
            
            if not input_text:
                result = {
                    "input": input_text,
                    "reference": reference,
                    "candidate": None,
                    "score": None,
                    "success": False,
                    "error": "Missing input text",
                    "task_type": task_type
                }
                results.append(result)
                continue
            
            logger.info(f"Evaluating ({task_type}): {input_text[:50]}...")
            result = self.evaluate_sample(input_text, reference, task_type)
            results.append(result)
            
            # Log result
            if result["success"]:
                logger.info(f"✓ Score: {result['score']:.2f} | Response: {result['candidate'][:50]}...")
            else:
                logger.error(f"✗ Error: {result['error']}")
        
        # Calculate metrics
        metrics = self.calculate_metrics(results)
        
        return results, metrics
    
    def calculate_metrics(self, results: List[Dict]) -> Dict:
        """Calculate evaluation metrics."""
        valid_scores = [r["score"] for r in results if r["success"] and r["score"] is not None]
        
        if not valid_scores:
            return {
                "total_samples": len(results),
                "successful_evaluations": 0,
                "success_rate": 0.0,
                "average_score": 0.0,
                "median_score": 0.0,
                "min_score": 0.0,
                "max_score": 0.0,
                "std_dev": 0.0
            }
        
        return {
            "total_samples": len(results),
            "successful_evaluations": len(valid_scores),
            "success_rate": len(valid_scores) / len(results),
            "average_score": statistics.mean(valid_scores),
            "median_score": statistics.median(valid_scores),
            "min_score": min(valid_scores),
            "max_score": max(valid_scores),
            "std_dev": statistics.stdev(valid_scores) if len(valid_scores) > 1 else 0.0
        }
    
    def save_results(self, results: List[Dict], metrics: Dict, output_path: str) -> None:
        """Save results and metrics to JSON file."""
        output_data = {
            "timestamp": datetime.now().isoformat(),
            "metrics": metrics,
            "results": results
        }
        
        try:
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Results saved to {output_path}")
            
        except Exception as e:
            logger.error(f"Error saving results: {e}")

def create_evaluator(endpoint_url: str, model_name: str, api_key: str = None, 
                    endpoint_type: str = "ollama", max_retries: int = 3, timeout: int = 30,
                    task_prompt: str = None, evaluation_criteria: str = None) -> StreamlitEvaluator:
    """Create a StreamlitEvaluator with custom LLM handler and task configuration."""
    llm_handler = CustomLLMHandler(
        endpoint_url=endpoint_url,
        model_name=model_name,
        api_key=api_key,
        endpoint_type=endpoint_type,
        max_retries=max_retries,
        timeout=timeout
    )
    
    return StreamlitEvaluator(
        llm_handler=llm_handler,
        task_prompt=task_prompt,
        evaluation_criteria=evaluation_criteria
    )
