"""
Configuration file for LLM Grammar Correction Evaluation

This file contains all configurable parameters for the evaluation system.
Modify these values to customize the evaluation behavior.
"""

# Model Configuration
QWEN_CONFIG = {
    "model": "qwen:0.6b",
    "endpoint": "http://localhost:11434/api/generate",
    "max_retries": 3,
    "timeout": 30,
    "prompt_template": "Correct the grammar: {input_text}"
}

AZURE_GPT_CONFIG = {
    "deployment": "gpt-4o",
    "api_version": "2024-02-01",
    "max_retries": 3,
    "timeout": 30,
    "max_tokens": 10,
    "temperature": 0,
    "scoring_criteria": {
        "perfect": 1.0,
        "minor_rewording": (0.8, 0.9),
        "partial_fixes": (0.6, 0.7),
        "poor_grammar": (0.3, 0.5),
        "irrelevant": (0.0, 0.2)
    }
}

# Data Configuration
DATA_CONFIG = {
    "test_data_path": "data/grammar_test.jsonl",
    "output_path": "outputs/results.json",
    "log_path": "outputs/evaluation.log"
}

# Visualization Configuration
PLOT_CONFIG = {
    "figsize": (12, 8),
    "style": "whitegrid",
    "dpi": 300,
    "score_bins": 15,
    "color_scheme": {
        "excellent": "green",    # >= 0.8
        "good": "orange",        # 0.6-0.8
        "poor": "red"           # < 0.6
    }
}

# Logging Configuration
LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "console_output": True,
    "file_output": True
}

# Evaluation Configuration
EVAL_CONFIG = {
    "batch_size": 1,  # Currently sequential processing
    "save_intermediate": True,
    "continue_on_error": True,
    "detailed_error_logging": True
}

# Performance Configuration
PERFORMANCE_CONFIG = {
    "enable_caching": False,
    "cache_ttl": 3600,  # 1 hour
    "parallel_processing": False,
    "max_workers": 4
}

# Metric Configuration
METRICS_CONFIG = {
    "calculate_percentiles": [25, 50, 75, 90, 95],
    "include_confidence_intervals": False,
    "bootstrap_samples": 1000
}

# Output Configuration
OUTPUT_CONFIG = {
    "save_individual_results": True,
    "save_summary_metrics": True,
    "save_detailed_logs": True,
    "generate_plots": True,
    "plot_formats": ["png"],
    "json_indent": 2
}

# Validation Configuration
VALIDATION_CONFIG = {
    "validate_inputs": True,
    "validate_outputs": True,
    "strict_json_format": True,
    "check_score_range": True
}

# API Rate Limiting Configuration
RATE_LIMIT_CONFIG = {
    "requests_per_minute": 60,
    "requests_per_hour": 1000,
    "backoff_multiplier": 2,
    "max_backoff_time": 300  # 5 minutes
}

# Custom Prompts
CUSTOM_PROMPTS = {
    "grammar_correction": "Correct the grammar in the following sentence: {input_text}",
    "detailed_correction": "Please correct the grammar and provide a brief explanation: {input_text}",
    "scoring_prompt": """
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
"""
}

# File Paths
PATHS = {
    "data_dir": "data",
    "output_dir": "outputs",
    "models_dir": "models",
    "plots_dir": "outputs",
    "logs_dir": "outputs"
}

# Feature Flags
FEATURES = {
    "enable_caching": False,
    "enable_parallel_processing": False,
    "enable_detailed_logging": True,
    "enable_progress_bar": True,
    "enable_auto_retry": True,
    "enable_result_validation": True,
    "enable_plot_generation": True,
    "enable_metrics_calculation": True
}

# Environment Variables (defaults)
ENV_DEFAULTS = {
    "AZURE_API_KEY": None,
    "AZURE_API_URL": "https://your-azure-instance.cognitiveservices.azure.com",
    "OLLAMA_ENDPOINT": "http://localhost:11434",
    "LOG_LEVEL": "INFO"
}

def get_config():
    """Get complete configuration dictionary."""
    return {
        "qwen": QWEN_CONFIG,
        "azure_gpt": AZURE_GPT_CONFIG,
        "data": DATA_CONFIG,
        "plot": PLOT_CONFIG,
        "logging": LOGGING_CONFIG,
        "eval": EVAL_CONFIG,
        "performance": PERFORMANCE_CONFIG,
        "metrics": METRICS_CONFIG,
        "output": OUTPUT_CONFIG,
        "validation": VALIDATION_CONFIG,
        "rate_limit": RATE_LIMIT_CONFIG,
        "prompts": CUSTOM_PROMPTS,
        "paths": PATHS,
        "features": FEATURES,
        "env_defaults": ENV_DEFAULTS
    }

def validate_config():
    """Validate configuration values."""
    config = get_config()
    
    # Validate score range
    if config["azure_gpt"]["scoring_criteria"]["perfect"] != 1.0:
        raise ValueError("Perfect score must be 1.0")
    
    # Validate paths
    for path_name, path_value in config["paths"].items():
        if not isinstance(path_value, str):
            raise ValueError(f"Path {path_name} must be a string")
    
    # Validate timeouts
    if config["qwen"]["timeout"] <= 0:
        raise ValueError("Qwen timeout must be positive")
    
    if config["azure_gpt"]["timeout"] <= 0:
        raise ValueError("Azure GPT timeout must be positive")
    
    return True

if __name__ == "__main__":
    # Validate configuration when run directly
    if validate_config():
        print("✓ Configuration is valid")
        
        # Print configuration summary
        config = get_config()
        print("\nConfiguration Summary:")
        print("-" * 30)
        for section, values in config.items():
            print(f"{section.upper()}:")
            if isinstance(values, dict):
                for key, value in values.items():
                    print(f"  {key}: {value}")
            print()
    else:
        print("✗ Configuration validation failed")
