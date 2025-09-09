# Testing the DataViz MCP Server with COVID-19 Data

This guide demonstrates how to test the advanced capabilities of the DataViz MCP Server using real-world COVID-19 time series data from Johns Hopkins University.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Run the COVID-19 data test
npm run test:covid

# 4. View the interactive demo
npm run demo
```

## Test Suite Overview

The COVID-19 test suite validates all advanced features:

### 🔍 **Auto-Discovery Pipeline**
- Automatically discovers COVID-19 CSV files
- Evaluates data quality with confidence scoring
- Auto-connects to the best data sources
- Provides comprehensive discovery statistics

### 🧠 **Advanced Pattern Detection**
Tests 15+ algorithms on real pandemic data:

| Pattern Type | Algorithm | COVID-19 Application |
|-------------|-----------|---------------------|
| **Exponential Growth** | Polynomial Regression | Early outbreak phases |
| **Multiple Waves** | Peak Detection + FFT | 1st, 2nd, 3rd waves |
| **Change Points** | CUSUM Detection | Lockdown/vaccination impact |
| **Seasonal Patterns** | Autocorrelation | Weather-driven cycles |
| **Country Clustering** | Hierarchical + K-means | Similar response profiles |
| **Anomaly Detection** | Statistical Outliers | Unusual outbreak patterns |
| **Correlation Analysis** | Pearson + Spearman | Deaths vs confirmed cases |

### 💬 **Natural Language Queries**
Test the NLP engine with pandemic-specific questions:

```javascript
// Example queries that work with COVID-19 data:
"What are the seasonal trends in our COVID-19 confirmed cases?"
"Show me correlations between deaths and confirmed cases"
"Find anomalies in the last 6 months of COVID data" 
"Compare pattern similarity between different countries"
"What's the statistical summary of global infection rates?"
```

### 🔒 **Pattern Fingerprinting**
Creates unique signatures for COVID-19 datasets:

```javascript
{
  id: "covid_confirmed_global_fp_2024",
  statistical: {
    distribution: "log_normal",    // Few countries, massive cases
    skewness: 3.7,                 // Heavy right tail
    kurtosis: 15.8,                // Extreme outliers present
    entropy: 8.4                   // High information content
  },
  temporal: {
    trend_strength: 0.91,          // Strong upward trend
    seasonality_strength: 0.73,    // Weather correlation
    dominant_frequency: 0.0027     // ~365 day cycle
  },
  relational: {
    dependency_strength: 0.84,     // Country interdependencies
    correlation_matrix_hash: "..."  // Cross-country patterns
  },
  anomaly: {
    outlier_density: 0.08,         // 8% outbreak countries
    max_severity: 4.7,             // Extreme events
    cluster_count: 3               // Outbreak clusters
  }
}
```

## Data Sources Tested

The test suite downloads and analyzes:

1. **Global Confirmed Cases** (`time_series_covid19_confirmed_global.csv`)
   - 🌍 Global time series data
   - 📊 ~290 countries/regions
   - 📈 Daily confirmed case counts
   - 🗓️ January 2020 - Present

2. **Global Deaths** (`time_series_covid19_deaths_global.csv`)
   - 💀 Mortality time series
   - 🔗 Correlated with confirmed cases
   - ⏰ ~14 day lag pattern
   - 📉 Lower variance than cases

3. **Global Recovered** (`time_series_covid19_recovered_global.csv`)
   - 🏥 Recovery tracking data
   - 📊 Variable reporting quality
   - 🌍 Policy impact analysis
   - 💪 Healthcare capacity insights

## Expected Test Results

### Pattern Detection Results

```
🔬 Detected COVID-19 Patterns:

1. Exponential Growth Trends
   Algorithm: Polynomial Regression (degree 2-3)
   Confidence: 92.4%
   P-value: 0.001
   Effect Size: Large

2. Multiple Wave Detection
   Algorithm: Frequency Domain Analysis + Peak Detection
   Confidence: 87.1%
   Description: First, second, and third wave identification

3. Intervention Impact Points
   Algorithm: Change Point Detection (CUSUM)
   Confidence: 89.3%
   Description: Lockdown and vaccination effect detection

4. Country Clustering Patterns
   Algorithm: Hierarchical Clustering + Silhouette Analysis
   Confidence: 78.5%
   Description: Similar pandemic response profiles

5. Seasonal Correlation
   Algorithm: Autocorrelation + Spectral Analysis
   Confidence: 73.2%
   Description: Weather-driven seasonal effects
```

### Natural Language Query Results

```
❓ "What are the seasonal trends in our COVID-19 confirmed cases?"
🤖 Intent: pattern_analysis (confidence: 0.89)
📊 Answer: Strong seasonal pattern detected with 73% confidence.
   Peak infections correlate with winter months (Nov-Feb).
   Dominant frequency: ~365 day cycle with harmonic at ~182 days.
📈 Visualizations: 2 (time series + seasonal decomposition)
💡 Follow-up: "What causes these seasonal patterns?"

❓ "Show me correlations between deaths and confirmed cases"
🤖 Intent: correlation_analysis (confidence: 0.94)
📊 Answer: Strong positive correlation (r=0.89, p<0.001).
   Deaths lag confirmed cases by approximately 14 days.
   Non-linear relationship detected (Spearman r=0.92).
📈 Visualizations: 2 (scatter plot + time series overlay)
💡 Follow-up: "Is this correlation causation?"
```

### Dataset Comparison Results

```
📊 COVID-19 Dataset Similarity Analysis:

Overall Similarity: 84.3%

Component Similarities:
  statistical  : ██████████ 91.2%
  temporal     : ████████░░ 88.7%
  relational   : ████████░░ 82.4%
  anomaly      : ███████░░░ 76.1%

Shared Patterns: trend, seasonal, correlation
Unique Patterns:
  confirmed: exponential_growth, multiple_peaks
  deaths: lagged_correlation, mortality_clusters
  recovered: recovery_rate_variance, policy_impact
```

## Advanced Testing Scenarios

### 1. Multi-Dataset Analysis
```bash
# Load multiple COVID-19 datasets
discover_data_sources --directory ./covid-data --autoConnect true

# Compare patterns across datasets
compare_datasets --connectionId1 confirmed --connectionId2 deaths

# Find similar patterns globally
find_similar_patterns --threshold 0.8
```

### 2. Time Series Deep Dive
```bash
# Advanced pattern detection
detect_advanced_patterns --connectionId confirmed_global

# Natural language exploration
ask_natural_language --query "What caused the third wave of COVID-19?"

# Generate comprehensive dashboard
generate_dashboard --maxVisualizations 8
```

### 3. Pattern Fingerprinting Workflow
```bash
# Generate fingerprints for each dataset
generate_pattern_fingerprint --connectionId confirmed
generate_pattern_fingerprint --connectionId deaths
generate_pattern_fingerprint --connectionId recovered

# Cluster by similarity
cluster_similar_datasets --threshold 0.7

# Export for analysis
export_fingerprints --format json
```

## Validation Criteria

### ✅ Auto-Discovery
- [ ] Discovers 3+ COVID-19 CSV files
- [ ] Confidence scores > 0.7 for valid files
- [ ] Correctly identifies time series structure
- [ ] Auto-connects to best quality sources

### ✅ Pattern Detection  
- [ ] Detects exponential growth patterns (confidence > 0.8)
- [ ] Identifies multiple wave structure
- [ ] Finds seasonal correlations with weather
- [ ] Detects policy intervention change points
- [ ] Clusters countries by similar responses

### ✅ Natural Language Processing
- [ ] Correctly interprets pandemic-related queries
- [ ] Generates appropriate visualizations
- [ ] Provides statistically accurate answers
- [ ] Suggests relevant follow-up questions

### ✅ Pattern Fingerprinting
- [ ] Generates unique dataset signatures
- [ ] Captures statistical characteristics accurately
- [ ] Identifies temporal patterns (trends, seasonality)
- [ ] Detects cross-dataset relationships
- [ ] Enables similarity matching

## Troubleshooting

### Common Issues

**1. Download Failures**
```bash
# Manual download if automated fails
curl -O https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv
```

**2. Memory Issues with Large Datasets**
```bash
# Use batch processing
node --max-old-space-size=4096 dist/index.js
```

**3. Pattern Detection Sensitivity**
```javascript
// Adjust confidence thresholds
detect_advanced_patterns({ 
  connectionId: "covid_data",
  minConfidence: 0.5  // Lower for exploratory analysis
})
```

## Performance Benchmarks

Expected performance on COVID-19 datasets:

| Operation | Dataset Size | Time | Memory |
|-----------|-------------|------|--------|
| Auto-discovery | 3 files, ~5MB total | <10s | <100MB |
| Pattern detection | ~100k data points | <30s | <500MB |
| Fingerprinting | Global time series | <15s | <200MB |
| NL query processing | Any size | <5s | <100MB |
| Dashboard generation | 8 visualizations | <45s | <300MB |

## Integration Testing

### MCP Protocol Compliance
```bash
# Test MCP server startup
npm start

# Validate tool registration
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npm start

# Test tool execution
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "discover_data_sources", "arguments": {"directory": "./test-data"}}}' | npm start
```

### End-to-End Workflow
```bash
# Complete analysis pipeline
npm run test:covid 2>&1 | tee covid-test-results.log

# Verify outputs
ls test-data/covid19/
# Expected: *.csv, *.json, *.html files
```

## Next Steps

After successful testing:

1. **Production Deployment**: Configure with your data sources
2. **Custom Patterns**: Add domain-specific pattern detectors  
3. **Integration**: Connect to BI tools or dashboards
4. **Scaling**: Implement distributed processing for large datasets
5. **Monitoring**: Set up logging and performance metrics

## Support

For issues or questions:
- Check the main [README.md](README.md) for setup instructions
- Review [examples](demo/) for usage patterns
- File issues on the project repository