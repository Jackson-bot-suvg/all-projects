import json
import os
import logging
import statistics
from datetime import datetime
from typing import List, Dict, Optional
from tqdm import tqdm
from dotenv import load_dotenv

from models.qwen import call_qwen
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

def load_test_data(file_path: str) -> List[Dict]:
    """Load test data from JSONL file with error handling."""
    test_data = []
    
    if not os.path.exists(file_path):
        logger.error(f"Test data file not found: {file_path}")
        return test_data
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                    
                try:
                    sample = json.loads(line)
                    # Validate required fields
                    if "input" not in sample or "ideal" not in sample:
                        logger.warning(f"Line {line_num}: Missing required fields (input/ideal)")
                        continue
                    test_data.append(sample)
                except json.JSONDecodeError as e:
                    logger.error(f"Line {line_num}: Invalid JSON - {e}")
                    continue
                    
        logger.info(f"Loaded {len(test_data)} test samples")
        return test_data
        
    except Exception as e:
        logger.error(f"Error loading test data: {e}")
        return []

def evaluate_sample(input_text: str, reference: str) -> Dict:
    """Evaluate a single sample and return results."""
    result = {
        "input": input_text,
        "reference": reference,
        "candidate": None,
        "score": None,
        "success": False,
        "error": None
    }
    
    try:
        # Get candidate correction from Qwen
        candidate = call_qwen(f"Correct the grammar: {input_text}")
        result["candidate"] = candidate
        
        if candidate is None:
            result["error"] = "Failed to get candidate correction"
            return result
        
        # Get score from GPT-4o
        score = call_gpt4o_score(input_text, candidate, reference)
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

def calculate_metrics(results: List[Dict]) -> Dict:
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

def save_results(results: List[Dict], metrics: Dict, output_path: str) -> None:
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

def main():
    """Main evaluation function."""
    logger.info("Starting evaluation process")
    
    # Load test data
    test_data = load_test_data("data/grammar_test.jsonl")
    
    if not test_data:
        logger.error("No test data available, exiting")
        return
    
    # Evaluate samples
    results = []
    
    for sample in tqdm(test_data, desc="Evaluating samples"):
        input_text = sample["input"]
        reference = sample["ideal"]
        
        logger.info(f"Evaluating: {input_text}")
        result = evaluate_sample(input_text, reference)
        results.append(result)
        
        # Log result
        if result["success"]:
            logger.info(f"✓ Score: {result['score']:.2f} | Candidate: {result['candidate']}")
        else:
            logger.error(f"✗ Error: {result['error']}")
    
    # Calculate metrics
    metrics = calculate_metrics(results)
    
    # Log summary
    logger.info("\n" + "="*50)
    logger.info("EVALUATION SUMMARY")
    logger.info("="*50)
    logger.info(f"Total samples: {metrics['total_samples']}")
    logger.info(f"Successful evaluations: {metrics['successful_evaluations']}")
    logger.info(f"Success rate: {metrics['success_rate']:.2%}")
    logger.info(f"Average score: {metrics['average_score']:.3f}")
    logger.info(f"Median score: {metrics['median_score']:.3f}")
    logger.info(f"Score range: {metrics['min_score']:.3f} - {metrics['max_score']:.3f}")
    logger.info(f"Standard deviation: {metrics['std_dev']:.3f}")
    logger.info("="*50)
    
    # Save results
    save_results(results, metrics, "outputs/results.json")
    
    logger.info("Evaluation completed")

if __name__ == "__main__":
    main()

