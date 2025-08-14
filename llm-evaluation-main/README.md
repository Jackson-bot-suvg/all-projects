# 🤖 Universal LLM Evaluation Dashboard

A comprehensive evaluation framework for **any fine-tuned Large Language Model** across multiple tasks including grammar correction, summarization, translation, question answering, text completion, classification, and custom tasks. Features an interactive Streamlit dashboard with advanced visualization and custom endpoint support.

## ✨ Features

### 🎯 Multi-Task Evaluation

- **Grammar Correction**: Fix grammatical errors in text
- **Summarization**: Generate concise summaries of long content
- **Translation**: Translate text between languages
- **Question Answering**: Answer questions based on context
- **Text Completion**: Complete partial text inputs
- **Classification**: Classify text into categories
- **Custom Tasks**: Define your own evaluation criteria and prompts

### 🔧 Core Evaluation

- **Multiple LLM Support**: Ollama, OpenAI-compatible APIs, and custom endpoints
- **Intelligent Response Cleaning**: Automatically removes "thinking" sections and unwanted formatting
- **Robust Error Handling**: Comprehensive retry logic with exponential backoff
- **Detailed Metrics**: Success rate, score statistics, and performance analytics

### 🌟 Interactive Dashboard

- **Streamlit Web Interface**: Modern, responsive web dashboard
- **Real-time Progress**: Live evaluation progress with sample-by-sample updates
- **Interactive Visualizations**: High-quality Plotly charts with zoom, filter, and hover
- **No Page Refreshes**: Persistent session state for seamless user experience

### 📊 Advanced Visualizations

- **Score Distribution**: Histograms and box plots for score analysis
- **Category Breakdown**: Pie charts showing performance categories
- **Trend Analysis**: Scatter plots revealing patterns across samples
- **Filterable Results**: Interactive tables with category and score filtering

### 🔧 Flexible Configuration

- **Custom Endpoints**: Support for any LLM API endpoint
- **Configurable Parameters**: Timeout, retries, batch size, and more
- **Multiple Data Formats**: JSON and JSONL dataset support
- **Downloadable Results**: Export results in CSV format

## 📁 Project Structure

```
LLM-EVAL/
├── models/
│   ├── __init__.py
│   ├── qwen.py              # Original Qwen model interface
│   ├── azure_gpt_judge.py   # Azure GPT-4o scoring interface
│   └── custom_llm.py        # Custom LLM handler for multiple endpoints
├── data/
│   └── grammar_test.jsonl   # Test data in JSONL format
├── outputs/
│   ├── results.json         # Evaluation results
│   ├── evaluation.log       # Detailed logs
│   └── *.png               # Generated plots
├── streamlit_app.py        # 🌟 Main Streamlit dashboard
├── streamlit_evaluator.py  # Evaluation engine for Streamlit app
├── evaluator.py            # Original CLI evaluation script
├── plot_results.py         # Static visualization script
├── test_response_cleaning.py # Response cleaning tests
├── run_streamlit.sh        # Quick start script
├── requirements.txt        # Python dependencies
├── config.py               # Configuration settings
├── .env                    # Environment variables
└── README.md              # This documentation
```

## 🚀 Quick Start

### 🌟 Streamlit Dashboard (Recommended)

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Launch the dashboard:**

   ```bash
   # Method 1: Using the run script
   ./run_streamlit.sh

   # Method 2: Direct command
   streamlit run streamlit_app.py
   ```

3. **Access the dashboard:**
   Open your browser to `http://localhost:8501`

### 💻 Prerequisites

- **Python 3.8+**
- **Judge Model**: Azure OpenAI GPT-4 access (required for scoring)
- **LLM Model**: One of the following:
  - Ollama (for local models like Qwen)
  - OpenAI API access
  - Custom LLM endpoint

### ⚙️ Setup Options

#### Option 1: Ollama (Local Models)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model (e.g., Qwen)
ollama pull qwen:0.6b

# Start Ollama server
ollama serve
```

#### Option 2: OpenAI API

- Get an API key from OpenAI
- Configure in the dashboard sidebar

#### Option 3: Custom Endpoint

- Use any OpenAI-compatible API
- Configure endpoint URL and authentication

### 🔑 Environment Configuration

Create or update `.env` file with your Azure OpenAI credentials:

```env
AZURE_API_KEY=your_azure_api_key_here
AZURE_API_URL=https://your-azure-instance.cognitiveservices.azure.com
```

## 📱 Usage

### 🌟 Streamlit Dashboard

1. **Select Task Type:**

   - Choose from grammar correction, summarization, translation, etc.
   - Or select "custom" to define your own evaluation criteria
   - Task-specific prompts are automatically generated

2. **Configure LLM Endpoint:**

   - Select endpoint type (Ollama, OpenAI, Custom)
   - Enter endpoint URL and authentication details
   - Test connection with the built-in test button

3. **Upload Dataset:**

   - Click "Browse files" to upload JSON/JSONL dataset
   - Preview your data in the expandable section
   - Reference format updates based on selected task type

4. **Run Evaluation:**

   - Click "Run Evaluation" to start processing
   - Monitor real-time progress with sample-by-sample updates
   - View live metrics as evaluation progresses

5. **Analyze Results:**

   - Explore interactive visualizations (zoom, filter, hover)
   - Filter results by score and category
   - Export results to CSV format
   - View detailed comparison table with task-specific columns

### 💻 CLI Mode (Legacy)

```bash
# Run evaluation
python evaluator.py

# Generate static plots
python plot_results.py
```

### 📊 Dashboard Features

#### 📍 Interactive Visualizations

- **Score Distribution**: Histogram and box plot with hover details
- **Category Breakdown**: Pie chart showing Excellent/Good/Poor performance
- **Trend Analysis**: Scatter plot revealing patterns across samples
- **Real-time Updates**: Charts update automatically as evaluation progresses

#### 📋 Results Table

- **Comprehensive View**: Input, LLM response, expected output, and scores
- **Smart Filtering**: Filter by minimum score and performance category
- **Clean Responses**: Automatically removes "thinking" sections from LLM outputs
- **Export Options**: Download filtered results as CSV

#### 🔧 Advanced Controls

- **Connection Testing**: Verify LLM endpoint connectivity before evaluation
- **Progress Tracking**: Real-time progress bar with sample-by-sample updates
- **Session Persistence**: No page refreshes - all data persists during session
- **Clear Controls**: Reset results or dataset with dedicated buttons

### 📝 Data Format

Supports both JSON and JSONL formats for all task types:

**Required Fields:**

- `input`: The input text/question/prompt for the task
- `ideal`/`reference`/`expected`: Expected output (optional for some tasks)

**Grammar Correction:**

```json
[
  {
    "input": "I are going to store.",
    "ideal": "I am going to the store."
  }
]
```

**Summarization:**

```json
[
  {
    "input": "Long article text here...",
    "ideal": "Brief summary here..."
  }
]
```

**Question Answering:**

```json
[
  {
    "input": "What is the capital of France?",
    "ideal": "Paris"
  }
]
```

**Classification:**

```json
[
  {
    "input": "This movie was amazing!",
    "ideal": "positive"
  }
]
```

**Custom Tasks:**

```json
[
  {
    "input": "Your task input here",
    "ideal": "Expected output (optional)"
  }
]
```

## 📊 Output Structure

### 🌟 Enhanced Results JSON

```json
{
  "timestamp": "2024-01-09T14:30:00",
  "metrics": {
    "total_samples": 10,
    "successful_evaluations": 8,
    "success_rate": 0.8,
    "average_score": 0.75,
    "median_score": 0.8,
    "min_score": 0.2,
    "max_score": 1.0,
    "std_dev": 0.25
  },
  "results": [
    {
      "input": "I go to school yesterday",
      "reference": "I went to school yesterday",
      "candidate": "I went to school yesterday", // Cleaned response
      "score": 1.0,
      "success": true,
      "error": null
    }
  ]
}
```

### 🧠 Response Cleaning

The system automatically cleans LLM responses by removing:

- **Think Tags**: `<think>...</think>` sections
- **Thinking Patterns**: `**thinking**...** end thinking**`
- **Reasoning Phrases**: "Let me think about this", "Looking at this sentence", etc.
- **Explanation Text**: "The original sentence", "So the corrected sentence", etc.
- **Extra Whitespace**: Multiple newlines and spacing issues

**Example:**

```
// Original LLM Response
<think>
The user wants me to correct grammar. Let me analyze this sentence.
The sentence "I are going to store" has a subject-verb disagreement.
</think>

I am going to the store.

// Cleaned Response
I am going to the store.
```

### Evaluation Metrics

- **Total Samples**: Number of test cases processed
- **Successful Evaluations**: Number of cases that completed without errors
- **Success Rate**: Percentage of successful evaluations
- **Average Score**: Mean score across all successful evaluations
- **Median Score**: Median score across all successful evaluations
- **Min/Max Score**: Score range
- **Standard Deviation**: Score variance measure

## ⚙️ Configuration

### 🔧 LLM Endpoint Types

#### Ollama (Local Models)

- **Default model**: `qwen:0.6b`
- **Endpoint**: `http://localhost:11434/api/generate`
- **Advantages**: Free, private, offline capable
- **Models**: Qwen, Llama, Mistral, etc.

#### OpenAI Compatible

- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Authentication**: Bearer token
- **Models**: GPT-3.5, GPT-4, etc.
- **Advantages**: High quality, reliable

#### Custom APIs

- **Flexible endpoint configuration**
- **Custom authentication methods**
- **Support for proprietary APIs**
- **Configurable request/response formats**

### 🔍 Advanced Settings

- **Timeout**: Request timeout (10-60 seconds)
- **Max Retries**: Number of retry attempts (1-5)
- **Batch Size**: Currently sequential processing
- **Response Cleaning**: Automatic removal of thinking sections

### 🎯 Scoring Criteria

The GPT-4o judge uses a detailed scoring scale:

| Score       | Description                            | Examples                         |
| ----------- | -------------------------------------- | -------------------------------- |
| **1.0**     | Perfect match with reference           | Identical correction             |
| **0.8-0.9** | Minor rewording, grammatically perfect | Different phrasing, same meaning |
| **0.6-0.7** | Partial fixes, mostly correct          | Some errors remain               |
| **0.3-0.5** | Poor grammar, missing key changes      | Major errors persist             |
| **0.0-0.2** | Irrelevant or completely wrong         | Unrelated response               |

## 🔧 Troubleshooting

### 🚫 Common Issues

#### 🔌 Connection Problems

- **Ollama Not Running**: Start with `ollama serve`
- **Model Not Found**: Pull with `ollama pull qwen:0.6b`
- **Port Issues**: Check if port 11434 is available
- **Firewall**: Ensure localhost access is allowed

#### 🔑 Authentication Errors

- **Azure API**: Verify credentials in `.env` file
- **OpenAI API**: Check API key validity and quota
- **Custom APIs**: Verify endpoint URL and auth method

#### 📊 Dashboard Issues

- **Streamlit Port**: Default is 8501, check if available
- **Browser Cache**: Clear cache or try incognito mode
- **File Upload**: Ensure JSON/JSONL format is correct
- **Session State**: Use "Clear Dataset" button if needed

### 📜 Logs and Debugging

- **Dashboard**: Real-time progress and error messages
- **File Logs**: Check `outputs/evaluation.log`
- **Console**: Run with `streamlit run streamlit_app.py --logger.level=debug`
- **Connection Test**: Use built-in test button before evaluation

### 📝 Validation

```bash
# Test response cleaning
python test_response_cleaning.py

# Validate Python syntax
python -m py_compile streamlit_app.py

# Check dependencies
pip check
```

## 🚀 Extending the Framework

### 🎯 Adding New LLM Models

1. **Create Model Handler**: Add new method to `models/custom_llm.py`
2. **Update Endpoint Types**: Modify `streamlit_app.py` endpoint mapping
3. **Test Integration**: Use connection test feature

```python
# Example: Adding Anthropic Claude
def _call_anthropic(self, prompt: str) -> Optional[str]:
    headers = {"x-api-key": self.api_key}
    payload = {"model": self.model_name, "prompt": prompt}
    # Implementation...
```

### 📊 Custom Evaluation Metrics

1. **Modify Evaluator**: Update `streamlit_evaluator.py`
2. **Update Visualizations**: Add new charts to dashboard
3. **Export Format**: Extend CSV export columns

### 🎯 Custom Scoring Criteria

1. **Judge Prompts**: Modify `azure_gpt_judge.py`
2. **Score Categories**: Update visualization color schemes
3. **Validation**: Test with `test_response_cleaning.py`

## 🕰️ Performance Considerations

- **Sequential Processing**: One sample at a time for stability
- **Response Cleaning**: Minimal overhead with regex patterns
- **Session State**: In-memory storage for dashboard persistence
- **Rate Limiting**: Exponential backoff for API reliability
- **Memory Usage**: Efficient handling of large datasets

## 🎆 New Features in v2.0

### 🌟 Interactive Dashboard

- Modern Streamlit interface with real-time updates
- Session persistence without page refreshes
- Interactive Plotly visualizations
- Advanced filtering and export options

### 🤖 Enhanced LLM Support

- Custom endpoint configuration
- Automatic response cleaning
- Connection testing
- Multiple authentication methods

### 📊 Improved Visualizations

- Interactive charts with zoom and hover
- Real-time progress tracking
- Performance category breakdowns
- Exportable results

### 🔧 Developer Experience

- Comprehensive error handling
- Detailed logging and debugging
- Validation scripts
- Quick start scripts

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Implement** your changes
4. **Test** with provided validation scripts
5. **Submit** a pull request

### 📝 Development Setup

```bash
# Install development dependencies
pip install -r requirements.txt

# Run tests
python test_response_cleaning.py

# Validate code
python -m py_compile streamlit_app.py
```

## 📞 Support

**🔍 For Issues:**

1. Check the 🔧 troubleshooting section
2. Review logs in `outputs/evaluation.log`
3. Test with built-in connection test
4. Create detailed issue report

**📚 Resources:**

- Interactive dashboard for real-time debugging
- Comprehensive logging system
- Validation scripts for testing
- Example datasets included

**🚫 Common Solutions:**

- Use `Clear Dataset` button for session reset
- Check `.env` file for API credentials
- Verify endpoint connectivity with test button
- Review response cleaning logs for parsing issues
