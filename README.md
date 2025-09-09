# DataViz MCP Server

A comprehensive Model Context Protocol (MCP) server for intelligent data pattern analysis and visualization. This advanced analytics platform provides automated data discovery, pattern fingerprinting, natural language querying, and sophisticated visualization capabilities.

## Architecture

The server follows an advanced modular architecture:

```
Auto-Discovery → Data Sources → Advanced Pattern Detection → AI Analysis → Pattern Fingerprinting → Similarity Engine → Natural Language Interface → Visualization Engine → Interactive Dashboard
```

### Core Components

- **Auto-Discovery Pipeline**: Automatically discovers and evaluates data sources with confidence scoring
- **Advanced Data Source Manager**: Multi-format support (CSV, JSON, Excel, SQL, APIs, Streaming, Images)
- **Advanced Pattern Detector**: 15+ algorithms for comprehensive pattern analysis
- **Pattern Fingerprinting System**: Creates unique signatures for data patterns
- **Pattern Similarity Engine**: Finds and compares similar datasets using fingerprint matching
- **Natural Language Processor**: Ask questions about your data in plain English
- **AI Analyzer**: Intelligent insights, recommendations, and automated analysis
- **Visualization Engine**: Dynamic SVG generation optimized for different patterns
- **MCP Tools**: 25+ interactive tools accessible through the Model Context Protocol

## Features

### Data Sources
- ✅ **File Formats**: CSV, JSON, Excel with intelligent parsing
- ✅ **Database Support**: PostgreSQL, MySQL, SQLite with query optimization
- ✅ **API Integration**: REST APIs with caching and authentication
- ✅ **Streaming Data**: WebSocket and Kafka real-time data ingestion
- ✅ **Image Processing**: Extract data from charts, graphs, and tables using OCR/CV
- ✅ **Web Scraping**: Automated data extraction from websites
- ✅ **Auto-Discovery**: Intelligent scanning and evaluation of data sources

### Advanced Pattern Detection
- ✅ **Trend Analysis**: Linear regression with confidence intervals
- ✅ **Distribution Analysis**: Normal, exponential, uniform, bimodal detection with goodness-of-fit
- ✅ **Correlation Discovery**: Pearson, Spearman, non-linear, polynomial relationships
- ✅ **Clustering**: K-means, hierarchical, DBSCAN with silhouette scoring
- ✅ **Time Series**: Seasonality, autocorrelation, autoregressive models (AR)
- ✅ **Frequency Analysis**: Peak detection, spectral entropy, dominant frequencies
- ✅ **Anomaly Detection**: Statistical outliers, change points, outlier clusters
- ✅ **Cyclical Patterns**: Multiple overlapping cycles with harmonic analysis

### Visualizations
- ✅ Line charts
- ✅ Bar charts
- ✅ Scatter plots
- ✅ Histograms
- ✅ Box plots
- ✅ Heatmaps (correlation matrices)
- ✅ Pie charts

### AI Analysis & Intelligence
- ✅ **Pattern Fingerprinting**: Unique signatures for datasets with statistical, temporal, relational components
- ✅ **Similarity Matching**: Find datasets with similar patterns using cosine similarity
- ✅ **Natural Language Processing**: Ask questions in plain English with intelligent query understanding
- ✅ **Automated Insights**: Context-aware recommendations and explanations
- ✅ **Pattern Clustering**: Group similar datasets automatically
- ✅ **Statistical Significance**: Confidence intervals, p-values, effect sizes for all patterns

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DATAVIZ
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Start the MCP server:
```bash
npm start
```

## Development

### Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure
```
src/
├── index.ts              # MCP server entry point
├── types/                # Type definitions
│   └── index.ts
├── services/             # Core business logic
│   ├── DataSourceManager.ts
│   ├── PatternDetector.ts
│   ├── AIAnalyzer.ts
│   └── VisualizationEngine.ts
├── tools/                # MCP tool definitions
│   └── index.ts
└── utils/                # Utility functions
```

## MCP Tools

The server exposes 25+ tools through the Model Context Protocol:

### Basic Data Management
- `connect_data_source` - Connect to CSV, JSON, or Excel files
- `load_data` - Load data from connected sources
- `list_connections` - View all active connections
- `get_data_summary` - Get overview of loaded data

### Advanced Data Sources
- `discover_data_sources` - Auto-discover data sources with confidence scoring
- `connect_advanced_source` - Connect to SQL databases, APIs, streaming sources, images
- `continuous_discovery` - Monitor directories for new data sources
- `get_streaming_status` - Monitor real-time data connections
- `manage_api_cache` - Control API data caching

### Pattern Analysis
- `analyze_patterns` - Basic pattern detection
- `detect_advanced_patterns` - Comprehensive analysis with 15+ algorithms
- `generate_pattern_fingerprint` - Create unique pattern signatures
- `find_similar_patterns` - Discover datasets with similar characteristics
- `compare_datasets` - Detailed comparison of two datasets
- `cluster_similar_datasets` - Group datasets by pattern similarity

### Natural Language Interface
- `ask_natural_language` - Query data using plain English
- `get_nl_examples` - Get example questions you can ask

### Visualization & Export
- `generate_visualization` - Create specific visualizations
- `generate_dashboard` - Create comprehensive dashboards
- `export_analysis` - Export results in JSON or HTML format
- `export_fingerprints` - Backup pattern fingerprints
- `import_fingerprints` - Restore fingerprint data

## Usage Examples

### Auto-Discovery Workflow

1. **Discover Data Sources**:
```json
{
  "tool": "discover_data_sources",
  "args": {
    "directory": "/data",
    "recursive": true,
    "autoConnect": true,
    "maxConnections": 3
  }
}
```

2. **Advanced Pattern Analysis**:
```json
{
  "tool": "detect_advanced_patterns",
  "args": {
    "connectionId": "auto_discovered_dataset"
  }
}
```

3. **Generate Pattern Fingerprint**:
```json
{
  "tool": "generate_pattern_fingerprint",
  "args": {
    "connectionId": "auto_discovered_dataset"
  }
}
```

### Natural Language Queries

Ask questions about your data in plain English:

```json
{
  "tool": "ask_natural_language",
  "args": {
    "connectionId": "sales_data",
    "query": "What are the seasonal trends in our sales data?"
  }
}
```

```json
{
  "tool": "ask_natural_language",
  "args": {
    "connectionId": "website_data", 
    "query": "Show me correlations between weather and website traffic"
  }
}
```

```json
{
  "tool": "ask_natural_language",
  "args": {
    "connectionId": "user_data",
    "query": "Find anomalies in the last 6 months of user engagement"
  }
}
```

### Advanced Data Sources

Connect to databases, APIs, and streaming data:

```json
{
  "tool": "connect_advanced_source",
  "args": {
    "id": "postgres_db",
    "type": "sql",
    "config": {
      "connectionString": "postgresql://user:pass@localhost/db",
      "query": "SELECT * FROM sales_metrics WHERE date >= NOW() - INTERVAL '30 days'"
    }
  }
}
```

```json
{
  "tool": "connect_advanced_source",
  "args": {
    "id": "api_metrics",
    "type": "api", 
    "config": {
      "apiUrl": "https://api.example.com/metrics",
      "apiKey": "your-api-key",
      "headers": {"Content-Type": "application/json"}
    }
  }
}
```

### Pattern Similarity Analysis

Find datasets with similar characteristics:

```json
{
  "tool": "find_similar_patterns",
  "args": {
    "connectionId": "target_dataset",
    "threshold": 0.8
  }
}
```

```json
{
  "tool": "compare_datasets", 
  "args": {
    "connectionId1": "sales_q1", 
    "connectionId2": "sales_q2"
  }
}
```

### Advanced Visualization

Create custom visualizations:
```json
{
  "tool": "generate_visualization",
  "args": {
    "connectionId": "sales_data",
    "type": "scatter",
    "xAxis": "advertising_spend",
    "yAxis": "revenue",
    "colorBy": "region",
    "title": "Revenue vs Advertising Spend by Region"
  }
}
```

## Pattern Detection Capabilities

The system automatically detects various data patterns:

### Trends
- Linear trends using regression analysis
- Confidence scoring based on R-squared values
- Direction detection (increasing/decreasing)

### Anomalies
- Statistical outlier detection (2+ standard deviations)
- Percentage of anomalous data points
- Data quality recommendations

### Correlations
- Pearson correlation analysis
- Strong correlation identification (|r| > 0.7)
- Relationship strength assessment

### Clusters
- K-means clustering with silhouette scoring
- Optimal cluster number detection
- Data segmentation insights

### Seasonality
- Autocorrelation-based seasonal detection
- Period identification
- Amplitude measurement

## Data Quality Assessment

The system provides comprehensive data quality analysis:

- Missing value detection
- Data type inference
- Statistical summaries
- Distribution analysis
- Recommendations for data improvement

## Export Formats

Analysis results can be exported in multiple formats:

### JSON Export
Complete structured data including:
- Detected patterns with confidence scores
- Statistical summaries
- Recommendations
- Visualization configurations

### HTML Export
Human-readable reports featuring:
- Executive summary
- Pattern visualizations
- Statistical tables
- Actionable recommendations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] Database connectivity (PostgreSQL, MySQL, SQLite)
- [ ] Real-time data streaming
- [ ] Machine learning model integration
- [ ] Advanced time series analysis
- [ ] Interactive web dashboard
- [ ] Collaborative analysis features
- [ ] Custom pattern detection algorithms
- [ ] Data transformation pipelines"# DataViz-MCP-Server" 
