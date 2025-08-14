import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import os
import logging
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)

def load_results(file_path: str) -> Optional[Dict]:
    """Load results from JSON file with error handling."""
    try:
        if not os.path.exists(file_path):
            logger.error(f"Results file not found: {file_path}")
            return None
            
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        logger.info(f"Loaded results from {file_path}")
        return data
        
    except Exception as e:
        logger.error(f"Error loading results: {e}")
        return None

def create_score_distribution_plot(df: pd.DataFrame, output_path: str) -> None:
    """Create score distribution histogram."""
    try:
        plt.figure(figsize=(12, 6))
        
        # Create subplot layout
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # Histogram with KDE
        sns.histplot(df['score'], bins=15, kde=True, alpha=0.7, ax=ax1)
        ax1.set_title("Score Distribution", fontsize=14, fontweight='bold')
        ax1.set_xlabel("Score", fontsize=12)
        ax1.set_ylabel("Frequency", fontsize=12)
        ax1.grid(True, alpha=0.3)
        
        # Box plot
        sns.boxplot(y=df['score'], ax=ax2)
        ax2.set_title("Score Box Plot", fontsize=14, fontweight='bold')
        ax2.set_ylabel("Score", fontsize=12)
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        logger.info(f"Score distribution plot saved to {output_path}")
        plt.close()
        
    except Exception as e:
        logger.error(f"Error creating score distribution plot: {e}")

def create_per_input_score_plot(df: pd.DataFrame, output_path: str) -> None:
    """Create per-input score bar chart."""
    try:
        # Sort by score and take top and bottom examples
        df_sorted = df.sort_values("score", ascending=False)
        
        plt.figure(figsize=(14, 10))
        
        # Create horizontal bar plot
        colors = ['green' if score >= 0.8 else 'orange' if score >= 0.6 else 'red' 
                 for score in df_sorted['score']]
        
        bars = plt.barh(range(len(df_sorted)), df_sorted['score'], color=colors, alpha=0.7)
        
        # Customize plot
        plt.xlabel("Score", fontsize=12)
        plt.ylabel("Input Sentences", fontsize=12)
        plt.title("Grammar Correction Scores by Input", fontsize=14, fontweight='bold')
        
        # Add input text as y-tick labels (truncated)
        y_labels = [text[:50] + '...' if len(text) > 50 else text for text in df_sorted['input']]
        plt.yticks(range(len(df_sorted)), y_labels, fontsize=10)
        
        # Add score values on bars
        for i, (bar, score) in enumerate(zip(bars, df_sorted['score'])):
            plt.text(bar.get_width() + 0.01, bar.get_y() + bar.get_height()/2, 
                    f'{score:.2f}', ha='left', va='center', fontsize=9)
        
        # Add legend
        from matplotlib.patches import Patch
        legend_elements = [Patch(facecolor='green', alpha=0.7, label='Excellent (≥0.8)'),
                          Patch(facecolor='orange', alpha=0.7, label='Good (0.6-0.8)'),
                          Patch(facecolor='red', alpha=0.7, label='Poor (<0.6)')]
        plt.legend(handles=legend_elements, loc='lower right')
        
        plt.grid(True, alpha=0.3, axis='x')
        plt.tight_layout()
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        logger.info(f"Per-input score plot saved to {output_path}")
        plt.close()
        
    except Exception as e:
        logger.error(f"Error creating per-input score plot: {e}")

def create_metrics_summary_plot(metrics: Dict, output_path: str) -> None:
    """Create metrics summary visualization."""
    try:
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
        
        # Success rate pie chart
        success_data = [metrics['successful_evaluations'], 
                       metrics['total_samples'] - metrics['successful_evaluations']]
        labels = ['Successful', 'Failed']
        colors = ['#2ecc71', '#e74c3c']
        
        ax1.pie(success_data, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
        ax1.set_title('Success Rate', fontsize=14, fontweight='bold')
        
        # Score statistics bar chart
        score_stats = ['Average', 'Median', 'Min', 'Max']
        score_values = [metrics['average_score'], metrics['median_score'], 
                       metrics['min_score'], metrics['max_score']]
        
        bars = ax2.bar(score_stats, score_values, color=['#3498db', '#9b59b6', '#e67e22', '#27ae60'])
        ax2.set_title('Score Statistics', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Score', fontsize=12)
        ax2.set_ylim(0, 1)
        
        # Add value labels on bars
        for bar, value in zip(bars, score_values):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                    f'{value:.3f}', ha='center', va='bottom', fontsize=10)
        
        # Metrics text summary
        ax3.text(0.1, 0.9, f"Total Samples: {metrics['total_samples']}", 
                transform=ax3.transAxes, fontsize=12, weight='bold')
        ax3.text(0.1, 0.8, f"Successful Evaluations: {metrics['successful_evaluations']}", 
                transform=ax3.transAxes, fontsize=12)
        ax3.text(0.1, 0.7, f"Success Rate: {metrics['success_rate']:.1%}", 
                transform=ax3.transAxes, fontsize=12)
        ax3.text(0.1, 0.6, f"Average Score: {metrics['average_score']:.3f}", 
                transform=ax3.transAxes, fontsize=12)
        ax3.text(0.1, 0.5, f"Median Score: {metrics['median_score']:.3f}", 
                transform=ax3.transAxes, fontsize=12)
        ax3.text(0.1, 0.4, f"Standard Deviation: {metrics['std_dev']:.3f}", 
                transform=ax3.transAxes, fontsize=12)
        ax3.text(0.1, 0.3, f"Score Range: {metrics['min_score']:.3f} - {metrics['max_score']:.3f}", 
                transform=ax3.transAxes, fontsize=12)
        
        ax3.set_xlim(0, 1)
        ax3.set_ylim(0, 1)
        ax3.set_title('Evaluation Metrics', fontsize=14, fontweight='bold')
        ax3.axis('off')
        
        # Score distribution (simple histogram)
        # This requires the actual score data, so we'll create a placeholder
        ax4.text(0.5, 0.5, 'Score Distribution\n(See separate plot)', 
                transform=ax4.transAxes, ha='center', va='center', 
                fontsize=12, weight='bold')
        ax4.set_title('Score Distribution', fontsize=14, fontweight='bold')
        ax4.axis('off')
        
        plt.tight_layout()
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        logger.info(f"Metrics summary plot saved to {output_path}")
        plt.close()
        
    except Exception as e:
        logger.error(f"Error creating metrics summary plot: {e}")

def main():
    """Main plotting function."""
    logger.info("Starting plot generation")
    
    # Load results
    data = load_results("outputs/results.json")
    
    if not data:
        logger.error("No data available for plotting")
        return
    
    # Extract results and metrics
    results = data.get('results', [])
    metrics = data.get('metrics', {})
    
    if not results:
        logger.error("No results found in data")
        return
    
    # Create DataFrame with successful results only
    successful_results = [r for r in results if r.get('success', False)]
    
    if not successful_results:
        logger.error("No successful results found for plotting")
        return
    
    df = pd.DataFrame(successful_results)
    
    # Ensure output directory exists
    os.makedirs("outputs", exist_ok=True)
    
    # Create plots
    create_score_distribution_plot(df, "outputs/score_distribution.png")
    create_per_input_score_plot(df, "outputs/per_input_scores.png")
    
    if metrics:
        create_metrics_summary_plot(metrics, "outputs/metrics_summary.png")
    
    logger.info("Plot generation completed")
    
    # Print summary
    print("\n" + "="*50)
    print("VISUALIZATION SUMMARY")
    print("="*50)
    print(f"Generated plots for {len(successful_results)} successful evaluations")
    print(f"Average score: {df['score'].mean():.3f}")
    print(f"Score range: {df['score'].min():.3f} - {df['score'].max():.3f}")
    print("Files created:")
    print("  - outputs/score_distribution.png")
    print("  - outputs/per_input_scores.png")
    if metrics:
        print("  - outputs/metrics_summary.png")
    print("="*50)

if __name__ == "__main__":
    main()
