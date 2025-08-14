# Import necessary libraries
import streamlit as st
import json
import requests
from streamlit_evaluator import create_evaluator
from models.custom_llm import test_connection
import pandas as pd
import os
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime
from tqdm import tqdm

# Path to the outputs directory
outputs_dir = "outputs"

# Ensure outputs directory exists
os.makedirs(outputs_dir, exist_ok=True)

# Streamlit app configuration
st.set_page_config(
    page_title="LLM Evaluation Dashboard", 
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'evaluation_results' not in st.session_state:
    st.session_state.evaluation_results = None
if 'evaluation_metrics' not in st.session_state:
    st.session_state.evaluation_metrics = None
if 'dataset_loaded' not in st.session_state:
    st.session_state.dataset_loaded = False
if 'valid_samples' not in st.session_state:
    st.session_state.valid_samples = None

# Custom CSS for better styling
st.markdown("""
<style>
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
    }
    .stDataFrame {
        background-color: white;
    }
</style>
""", unsafe_allow_html=True)

st.title("🤖 LLM Evaluation Dashboard")
st.markdown("*Comprehensive evaluation framework for any fine-tuned LLM across multiple tasks*")

# Sidebar configuration
st.sidebar.header("⚙️ Configuration")

# LLM Endpoint section
st.sidebar.subheader("API Settings")
endpoint_type = st.sidebar.selectbox(
    "Endpoint Type",
    ["Ollama (Default)", "Custom API", "OpenAI Compatible"]
)

if endpoint_type == "Ollama (Default)":
    llm_url = st.sidebar.text_input("LLM Endpoint URL", "http://localhost:11434/api/generate")
    model_name = st.sidebar.text_input("Model Name", "qwen:0.6b")
else:
    llm_url = st.sidebar.text_input("LLM Endpoint URL", "https://api.example.com/v1/chat/completions")
    model_name = st.sidebar.text_input("Model Name", "gpt-3.5-turbo")
    api_key = st.sidebar.text_input("API Key (if required)", type="password")

# Task configuration
st.sidebar.subheader("🎯 Task Configuration")
task_type = st.sidebar.selectbox(
    "Task Type",
    [
        "grammar_correction",
        "summarization", 
        "translation",
        "question_answering",
        "text_completion",
        "classification",
        "custom"
    ],
    help="Select the type of task your LLM was fine-tuned for"
)

# Custom task prompt (only shown for custom task type)
if task_type == "custom":
    custom_prompt = st.sidebar.text_area(
        "Custom Task Prompt",
        "Process this input: {input_text}",
        help="Use {input_text} as placeholder for the input text"
    )
    
    custom_criteria = st.sidebar.text_area(
        "Custom Evaluation Criteria",
        """Evaluate the response quality from 0.0 to 1.0 based on:
- Accuracy and correctness
- Completeness and relevance
- Clarity and coherence

Reply only with a number between 0.0 and 1.0.""",
        help="Define how the judge should evaluate responses"
    )
else:
    custom_prompt = None
    custom_criteria = None

# Judge model settings
st.sidebar.subheader("Judge Model Settings")
judge_model = st.sidebar.selectbox(
    "Judge Model",
    ["Azure GPT-4", "OpenAI GPT-4", "Custom"]
)

# Dataset section
st.sidebar.subheader("📊 Dataset")
uploaded_file = st.sidebar.file_uploader(
    "Upload JSON dataset", 
    type=["json", "jsonl"],
    help="Upload a JSON file with 'input' and 'ideal' fields"
)

# Sample data format
with st.sidebar.expander("📋 Expected Format"):
    st.markdown("**Required fields:**")
    st.markdown("- `input`: The input text/question/prompt")
    st.markdown("- `ideal`/`reference`/`expected`: Reference answer (optional for some tasks)")
    
    if task_type == "grammar_correction":
        st.code('''
[
  {
    "input": "I are going to store.",
    "ideal": "I am going to the store."
  }
]
        ''', language="json")
    elif task_type == "summarization":
        st.code('''
[
  {
    "input": "Long article text here...",
    "ideal": "Brief summary here..."
  }
]
        ''', language="json")
    elif task_type == "question_answering":
        st.code('''
[
  {
    "input": "What is the capital of France?",
    "ideal": "Paris"
  }
]
        ''', language="json")
    elif task_type == "classification":
        st.code('''
[
  {
    "input": "This movie was amazing!",
    "ideal": "positive"
  }
]
        ''', language="json")
    else:
        st.code('''
[
  {
    "input": "Your task input here",
    "ideal": "Expected output (optional)"
  }
]
        ''', language="json")

# Advanced settings
with st.sidebar.expander("🔧 Advanced Settings"):
    batch_size = st.slider("Batch Size", 1, 10, 1)
    max_retries = st.slider("Max Retries", 1, 5, 3)
    timeout = st.slider("Timeout (seconds)", 10, 60, 30)

# Main content area
if uploaded_file is not None:
    # Load and validate dataset
    try:
        if uploaded_file.name.endswith('.jsonl'):
            # Handle JSONL format
            samples = []
            for line in uploaded_file:
                samples.append(json.loads(line.decode('utf-8')))
        else:
            # Handle JSON format
            samples = json.load(uploaded_file)
        
        st.success(f"✅ Dataset loaded successfully! Found {len(samples)} samples.")
        
        # Display sample data
        with st.expander("👀 Preview Dataset"):
            st.dataframe(pd.DataFrame(samples).head())
        
        # Validation
        st.session_state.valid_samples = []
        for i, sample in enumerate(samples):
            if "input" in sample and "ideal" in sample:
                st.session_state.valid_samples.append(sample)
            else:
                st.warning(f"Sample {i+1} missing required fields (input/ideal)")
        
        st.session_state.dataset_loaded = True
    
    except Exception as e:
        st.error(f"❌ Error loading dataset: {str(e)}")


# Run evaluation if dataset is already loaded
if st.session_state.dataset_loaded and st.session_state.valid_samples:
    st.info(f"✅ {len(st.session_state.valid_samples)} valid samples ready for evaluation.")

    # Button row
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🔍 Test Connection", type="secondary"):
            endpoint_type_map = {
                "Ollama (Default)": "ollama",
                "Custom API": "custom",
                "OpenAI Compatible": "openai"
            }
            
            test_api_key = api_key if endpoint_type != "Ollama (Default)" else None
            
            with st.spinner("Testing connection..."):
                if test_connection(llm_url, model_name, test_api_key, endpoint_type_map[endpoint_type]):
                    st.success("✅ Connection successful!")
                else:
                    st.error("❌ Connection failed. Please check your configuration.")
    
    with col2:
        if st.button("🚀 Run Evaluation", type="primary"):
            # Create evaluator
            endpoint_type_map = {
                "Ollama (Default)": "ollama",
                "Custom API": "custom",
                "OpenAI Compatible": "openai"
            }
            
            eval_api_key = api_key if endpoint_type != "Ollama (Default)" else None
            
            try:
                evaluator = create_evaluator(
                    endpoint_url=llm_url,
                    model_name=model_name,
                    api_key=eval_api_key,
                    endpoint_type=endpoint_type_map[endpoint_type],
                    max_retries=max_retries,
                    timeout=timeout,
                    task_prompt=custom_prompt,
                    evaluation_criteria=custom_criteria
                )
                
                with st.spinner(f"Running {task_type} evaluation... This may take a while."):
                    # Progress bar
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                    
                    def progress_callback(current, total, current_input):
                        status_text.text(f"Evaluating sample {current+1}/{total}: {current_input[:50]}...")
                        progress_bar.progress((current + 1) / total)
                    
                    # Run evaluation with task type
                    results, metrics = evaluator.evaluate_dataset(
                        st.session_state.valid_samples, 
                        task_type=task_type,
                        progress_callback=progress_callback
                    )
                    st.session_state.evaluation_results = results
                    st.session_state.evaluation_metrics = metrics
                    
                    # Save results
                    evaluator.save_results(results, metrics, os.path.join(outputs_dir, "results.json"))

            except Exception as e:
                st.error(f"❌ Error creating evaluator: {str(e)}")
                st.stop()
            
            progress_bar.empty()
            status_text.empty()
    
    with col3:
        if st.button("🗑️ Clear Results", type="secondary"):
            st.session_state.evaluation_results = None
            st.session_state.evaluation_metrics = None
            st.success("Results cleared!")
            st.rerun()

    # Add a button to clear dataset as well
    if st.button("📝 Clear Dataset", type="secondary"):
        st.session_state.dataset_loaded = False
        st.session_state.valid_samples = None
        st.session_state.evaluation_results = None
        st.session_state.evaluation_metrics = None
        st.success("Dataset cleared!")
        st.rerun()
        

# Display results if they exist
if st.session_state.evaluation_results and st.session_state.evaluation_metrics:
    results = st.session_state.evaluation_results
    metrics = st.session_state.evaluation_metrics
    
    # Display results
    st.success("🎉 Evaluation completed successfully!")
    
    # Metrics overview
    st.subheader("📈 Evaluation Metrics")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            "Total Samples",
            metrics['total_samples']
        )
    
    with col2:
        st.metric(
            "Success Rate",
            f"{metrics['success_rate']:.1%}",
            f"{metrics['successful_evaluations']}/{metrics['total_samples']}"
        )
    
    with col3:
        st.metric(
            "Average Score",
            f"{metrics['average_score']:.3f}",
            f"σ = {metrics['std_dev']:.3f}"
        )
    
    with col4:
        st.metric(
            "Score Range",
            f"{metrics['min_score']:.3f} - {metrics['max_score']:.3f}",
            f"Median: {metrics['median_score']:.3f}"
        )
    
    # Prepare data for visualization
    successful_results = [r for r in results if r['success']]
    
    if successful_results:
        df = pd.DataFrame(successful_results)
        
        # Add score categories
        df['score_category'] = df['score'].apply(
            lambda x: 'Excellent (≥0.8)' if x >= 0.8
            else 'Good (0.6-0.8)' if x >= 0.6
            else 'Poor (<0.6)'
        )
        
        # Interactive visualizations
        st.subheader("📊 Interactive Visualizations")
        
        # Score distribution
        col1, col2 = st.columns(2)
        
        with col1:
            fig_hist = px.histogram(
                df, 
                x='score', 
                nbins=20,
                title='Score Distribution',
                labels={'score': 'Score', 'count': 'Frequency'},
                color_discrete_sequence=['#1f77b4']
            )
            fig_hist.update_layout(height=400)
            st.plotly_chart(fig_hist, use_container_width=True)
        
        with col2:
            fig_box = px.box(
                df, 
                y='score',
                title='Score Distribution (Box Plot)',
                labels={'score': 'Score'}
            )
            fig_box.update_layout(height=400)
            st.plotly_chart(fig_box, use_container_width=True)
        
        # Score by category
        category_counts = df['score_category'].value_counts()
        fig_pie = px.pie(
            values=category_counts.values,
            names=category_counts.index,
            title='Score Categories',
            color_discrete_map={
                'Poor (<0.6)': '#e74c3c',
                'Good (0.6-0.8)': '#f39c12',
                'Excellent (≥0.8)': '#2ecc71'
            }
        )
        st.plotly_chart(fig_pie, use_container_width=True)
        
        # Score trends (if applicable)
        df['index'] = range(len(df))
        fig_trend = px.scatter(
            df, 
            x='index', 
            y='score',
            color='score_category',
            title='Score Trends Across Samples',
            labels={'index': 'Sample Index', 'score': 'Score'},
            color_discrete_map={
                'Excellent (≥0.8)': '#2ecc71',
                'Good (0.6-0.8)': '#f39c12',
                'Poor (<0.6)': '#e74c3c'
            }
        )
        fig_trend.update_layout(height=400)
        st.plotly_chart(fig_trend, use_container_width=True)
        
        # Detailed results table
        st.subheader("📋 Detailed Results")
        
        # Rename columns for better display
        display_df = df.copy()
        display_df = display_df.rename(columns={
            'input': '📝 Input',
            'candidate': '🤖 LLM Response',
            'reference': '✅ Expected Output',
            'score': '📊 Score',
            'score_category': '📈 Category',
            'task_type': '🎯 Task Type'
        })
        
        # Select columns to display
        display_columns = ['📝 Input', '🤖 LLM Response', '✅ Expected Output', '📊 Score', '📈 Category']
        
        # Add task type column if it exists
        if 'task_type' in df.columns:
            display_columns.insert(1, '🎯 Task Type')
        
        # Add filters
        col1, col2 = st.columns(2)
        with col1:
            score_filter = st.slider(
                "Filter by minimum score",
                0.0, 1.0, 0.0, 0.1
            )
        with col2:
            category_filter = st.multiselect(
                "Filter by category",
                options=display_df['📈 Category'].unique(),
                default=display_df['📈 Category'].unique()
            )
        
        # Apply filters
        filtered_df = display_df[
            (display_df['📊 Score'] >= score_filter) & 
            (display_df['📈 Category'].isin(category_filter))
        ]
        
        # Display filtered table
        st.dataframe(
            filtered_df[display_columns],
            use_container_width=True,
            height=400
        )
        
        # Download results
        csv = filtered_df.to_csv(index=False)
        st.download_button(
            label="📥 Download Results as CSV",
            data=csv,
            file_name=f"evaluation_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv"
        )
        
        # Show failed evaluations if any
        failed_results = [r for r in results if not r['success']]
        if failed_results:
            with st.expander(f"⚠️ Failed Evaluations ({len(failed_results)})"):
                failed_df = pd.DataFrame(failed_results)
                st.dataframe(
                    failed_df[['input', 'reference', 'error']],
                    use_container_width=True
                )

    else:
        st.error("❌ No successful evaluations found. Please check your configuration.")

else:
    # Welcome message
    st.markdown("""
    ## 👋 Welcome to the LLM Evaluation Dashboard!
    
    This comprehensive framework evaluates **any fine-tuned Language Model** across multiple tasks including grammar correction, summarization, translation, question answering, and more.
    
    ### 🚀 Getting Started:
    1. **Select your task type** from the sidebar (grammar correction, summarization, etc.)
    2. **Configure your LLM endpoint** (Ollama, OpenAI, or custom API)
    3. **Upload your dataset** with input and expected output pairs
    4. **Run the evaluation** and explore interactive results
    
    ### 🎯 Supported Tasks:
    - **Grammar Correction**: Fix grammatical errors in text
    - **Summarization**: Generate concise summaries of long text
    - **Translation**: Translate text between languages
    - **Question Answering**: Answer questions based on context
    - **Text Completion**: Complete partial text inputs
    - **Classification**: Classify text into categories
    - **Custom Tasks**: Define your own evaluation criteria
    
    ### 📊 What you'll get:
    - **Comprehensive metrics** (success rate, average score, etc.)
    - **Interactive visualizations** (histograms, box plots, pie charts)
    - **Detailed results table** with filtering and export options
    - **Task-specific evaluation** with appropriate prompts
    - **Clean LLM responses** with automatic "thinking" removal
    
    ### 💡 Tips:
    - Choose the task type that matches your fine-tuned model
    - Reference answers are optional for some tasks (the judge can evaluate quality)
    - Use custom prompts for specialized evaluation scenarios
    - Test your LLM connection before running full evaluation
    """)
    
    # Show example datasets for different tasks
    st.subheader("📋 Example Datasets")
    
    task_examples = {
        "Grammar Correction": [
            {"input": "I are going to store.", "ideal": "I am going to the store."},
            {"input": "She have a book.", "ideal": "She has a book."}
        ],
        "Summarization": [
            {"input": "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet and is commonly used for testing.", "ideal": "A pangram about a fox jumping over a dog, used for testing."},
            {"input": "Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data.", "ideal": "ML is an AI subset using algorithms that learn from data."}
        ],
        "Question Answering": [
            {"input": "What is the capital of France?", "ideal": "Paris"},
            {"input": "Who wrote Romeo and Juliet?", "ideal": "William Shakespeare"}
        ],
        "Classification": [
            {"input": "This movie was amazing! I loved every minute of it.", "ideal": "positive"},
            {"input": "Terrible service, would not recommend.", "ideal": "negative"}
        ]
    }
    
    selected_example = st.selectbox("Select task type for example:", list(task_examples.keys()))
    st.json(task_examples[selected_example])
    
    # Create downloadable example
    selected_data = task_examples[selected_example]
    st.download_button(
        label=f"📥 Download {selected_example} Example",
        data=json.dumps(selected_data, indent=2),
        file_name=f"example_{selected_example.lower().replace(' ', '_')}.json",
        mime="application/json"
    )
