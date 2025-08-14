#!/bin/bash

# LLM Evaluation Streamlit App Runner
echo "🚀 Starting LLM Evaluation Dashboard..."
echo "================================================"

# Check if required packages are installed
echo "📦 Checking dependencies..."
python3 -c "import streamlit, plotly, pandas, requests" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Missing dependencies. Installing..."
    pip3 install -r requirements.txt
fi

# Start the Streamlit app
echo "🌟 Launching Streamlit dashboard..."
echo "📱 Access the app at: http://localhost:8501"
echo "🛑 Press Ctrl+C to stop the server"
echo "================================================"

streamlit run streamlit_app.py
