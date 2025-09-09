export interface DataPoint {
  id: string;
  timestamp: number;
  values: Record<string, number | string | boolean>;
  metadata?: Record<string, any>;
}

export interface DataPattern {
  type: 'trend' | 'seasonal' | 'cyclical' | 'anomaly' | 'correlation' | 'cluster';
  confidence: number;
  description: string;
  parameters: Record<string, any>;
  affectedColumns: string[];
  timeRange?: {
    start: number;
    end: number;
  };
}

export interface DataSource {
  type: 'csv' | 'json' | 'excel' | 'database' | 'api';
  config: Record<string, any>;
  schema?: Record<string, string>;
}

export interface VisualizationConfig {
  type: 'line' | 'bar' | 'scatter' | 'heatmap' | 'histogram' | 'box' | 'pie';
  data: DataPoint[];
  xAxis?: string;
  yAxis?: string;
  colorBy?: string;
  groupBy?: string;
  title?: string;
  width?: number;
  height?: number;
}

export interface AnalysisResult {
  patterns: DataPattern[];
  statistics: {
    mean: Record<string, number>;
    median: Record<string, number>;
    stdDev: Record<string, number>;
    correlations: Record<string, Record<string, number>>;
  };
  recommendations: string[];
  visualizations: VisualizationConfig[];
}

export interface DataSourceConnection {
  id: string;
  source: DataSource;
  status: 'connected' | 'disconnected' | 'error';
  lastUpdated: number;
}