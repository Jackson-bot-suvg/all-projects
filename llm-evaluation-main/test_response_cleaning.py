#!/usr/bin/env python3
"""
Test script to verify response cleaning functionality
"""

from models.custom_llm import CustomLLMHandler

# Test response cleaning
handler = CustomLLMHandler("http://localhost:11434/api/generate", "test", endpoint_type="ollama")

# Test cases with thinking patterns
test_responses = [
    """<think>
    The user wants me to correct grammar. Let me analyze this sentence.
    The sentence "I are going to store" has a subject-verb disagreement.
    "I" should be followed by "am" not "are".
    Also, "store" should be "the store" for proper article usage.
    </think>
    
    I am going to the store.""",
    
    """**thinking**
    This sentence has grammar issues. "She have" should be "She has" for subject-verb agreement.
    **end thinking**
    
    She has a book.""",
    
    """Let me think about this sentence.
    The original sentence is: "They was playing yesterday."
    I need to correct the verb form.
    
    They were playing yesterday.""",
    
    """Looking at this sentence, I can see there's a grammar error.
    First, I need to identify the issue.
    So the corrected sentence would be:
    
    The cat is sleeping on the mat.""",
    
    """I am going to the store.""",  # Already clean
    
    """<think>Complex thinking with multiple lines
    This is a longer thinking process
    with multiple considerations
    </think>
    
    The final answer is: She reads books every day."""
]

print("Testing response cleaning functionality:")
print("=" * 60)

for i, response in enumerate(test_responses, 1):
    print(f"\nTest {i}:")
    print(f"Original: {repr(response)}")
    
    cleaned = handler.clean_response(response)
    print(f"Cleaned:  {repr(cleaned)}")
    
    print("-" * 40)

print("\n✅ Response cleaning test completed!")
