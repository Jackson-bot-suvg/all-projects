"""
Models package for LLM Grammar Correction Evaluation

This package contains model interfaces for different LLM providers.
"""

from .qwen import call_qwen
from .azure_gpt_judge import call_gpt4o_score

__all__ = ['call_qwen', 'call_gpt4o_score']
