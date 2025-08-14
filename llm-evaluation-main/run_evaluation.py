#!/usr/bin/env python3
"""
LLM Grammar Correction Evaluation Runner

This script runs the complete evaluation pipeline:
1. Checks system requirements
2. Runs the evaluation
3. Generates visualizations
4. Provides a summary report
"""

import os
import sys
import subprocess
import requests
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_ollama_service():
    """Check if Ollama service is running and accessible."""
    try:
        response = requests.get("http://localhost:11434/api/version", timeout=5)
        if response.status_code == 200:
            logger.info("✓ Ollama service is running")
            return True
        else:
            logger.error(f"✗ Ollama service returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f"✗ Ollama service is not accessible: {e}")
        return False

def check_qwen_model():
    """Check if Qwen model is available."""
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "qwen3:0.6b", "prompt": "test", "stream": False},
            timeout=10
        )
        if response.status_code == 200:
            logger.info("✓ Qwen model is available")
            return True
        else:
            logger.error(f"✗ Qwen model not available: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f"✗ Qwen model check failed: {e}")
        return False

def check_azure_credentials():
    """Check if Azure OpenAI credentials are configured."""
    api_key = os.getenv('AZURE_API_KEY')
    api_url = os.getenv('AZURE_API_URL')
    
    if not api_key:
        logger.error("✗ AZURE_API_KEY not found in environment variables")
        return False
    
    if not api_url:
        logger.error("✗ AZURE_API_URL not found in environment variables")
        return False
    
    if api_url == "https://your-azure-instance.cognitiveservices.azure.com":
        logger.error("✗ AZURE_API_URL is still using placeholder value")
        return False
    
    logger.info("✓ Azure credentials are configured")
    return True

def check_test_data():
    """Check if test data file exists and is valid."""
    data_file = "data/grammar_test.jsonl"
    
    if not os.path.exists(data_file):
        logger.error(f"✗ Test data file not found: {data_file}")
        return False
    
    try:
        with open(data_file, 'r') as f:
            lines = f.readlines()
            if len(lines) == 0:
                logger.error("✗ Test data file is empty")
                return False
            logger.info(f"✓ Test data file contains {len(lines)} samples")
            return True
    except Exception as e:
        logger.error(f"✗ Error reading test data: {e}")
        return False

def run_system_checks():
    """Run all system requirement checks."""
    logger.info("Running system checks...")
    
    checks = [
        ("Ollama Service", check_ollama_service),
        ("Qwen Model", check_qwen_model),
        ("Azure Credentials", check_azure_credentials),
        ("Test Data", check_test_data),
    ]
    
    passed = 0
    failed = 0
    
    for check_name, check_func in checks:
        try:
            if check_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            logger.error(f"✗ {check_name} check failed with exception: {e}")
            failed += 1
    
    logger.info(f"System checks completed: {passed} passed, {failed} failed")
    return failed == 0

def run_evaluation():
    """Run the main evaluation script."""
    logger.info("Starting evaluation process...")
    
    try:
        # Ensure outputs directory exists
        os.makedirs("outputs", exist_ok=True)
        
        # Run evaluation
        result = subprocess.run([sys.executable, "evaluator.py"], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info("✓ Evaluation completed successfully")
            return True
        else:
            logger.error(f"✗ Evaluation failed with return code {result.returncode}")
            logger.error(f"Error output: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"✗ Error running evaluation: {e}")
        return False

def generate_visualizations():
    """Generate result visualizations."""
    logger.info("Generating visualizations...")
    
    try:
        result = subprocess.run([sys.executable, "plot_results.py"], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info("✓ Visualizations generated successfully")
            return True
        else:
            logger.error(f"✗ Visualization generation failed with return code {result.returncode}")
            logger.error(f"Error output: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"✗ Error generating visualizations: {e}")
        return False

def print_summary():
    """Print evaluation summary."""
    results_file = "outputs/results.json"
    
    if not os.path.exists(results_file):
        logger.error("No results file found")
        return
    
    try:
        import json
        with open(results_file, 'r') as f:
            data = json.load(f)
        
        metrics = data.get('metrics', {})
        
        print("\n" + "="*60)
        print("EVALUATION SUMMARY")
        print("="*60)
        print(f"Timestamp: {data.get('timestamp', 'Unknown')}")
        print(f"Total Samples: {metrics.get('total_samples', 0)}")
        print(f"Successful Evaluations: {metrics.get('successful_evaluations', 0)}")
        print(f"Success Rate: {metrics.get('success_rate', 0):.1%}")
        print(f"Average Score: {metrics.get('average_score', 0):.3f}")
        print(f"Median Score: {metrics.get('median_score', 0):.3f}")
        print(f"Score Range: {metrics.get('min_score', 0):.3f} - {metrics.get('max_score', 0):.3f}")
        print(f"Standard Deviation: {metrics.get('std_dev', 0):.3f}")
        
        print("\nFiles Generated:")
        output_files = [
            "outputs/results.json",
            "outputs/evaluation.log",
            "outputs/score_distribution.png",
            "outputs/per_input_scores.png",
            "outputs/metrics_summary.png"
        ]
        
        for file_path in output_files:
            if os.path.exists(file_path):
                print(f"  ✓ {file_path}")
            else:
                print(f"  ✗ {file_path} (missing)")
        
        print("="*60)
        
    except Exception as e:
        logger.error(f"Error reading results: {e}")

def main():
    """Main execution function."""
    print("LLM Grammar Correction Evaluation Runner")
    print("="*50)
    
    # Check system requirements
    if not run_system_checks():
        print("\n❌ System checks failed. Please fix the issues above before running evaluation.")
        print("\nCommon solutions:")
        print("1. Start Ollama: ollama serve")
        print("2. Pull Qwen model: ollama pull qwen:0.6b")
        print("3. Update .env file with correct Azure credentials")
        print("4. Ensure data/grammar_test.jsonl contains test data")
        sys.exit(1)
    
    print("\n✅ All system checks passed!")
    
    # Run evaluation
    if not run_evaluation():
        print("\n❌ Evaluation failed. Check the logs for details.")
        sys.exit(1)
    
    # Generate visualizations
    if not generate_visualizations():
        print("\n⚠️  Visualization generation failed, but evaluation completed.")
        print("You can try running 'python plot_results.py' separately.")
    
    # Print summary
    print_summary()
    
    print("\n🎉 Evaluation pipeline completed successfully!")
    print("Check the outputs/ directory for detailed results and visualizations.")

if __name__ == "__main__":
    main()
