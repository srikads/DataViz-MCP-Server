import * as ss from 'simple-statistics';
import { DataPoint, DataPattern, AnalysisResult, VisualizationConfig } from '../types/index.js';
import { PatternDetector } from './PatternDetector.js';

export class AIAnalyzer {
  private patternDetector: PatternDetector;

  constructor() {
    this.patternDetector = new PatternDetector();
  }

  async analyzeData(data: DataPoint[]): Promise<AnalysisResult> {
    if (data.length === 0) {
      return {
        patterns: [],
        statistics: {
          mean: {},
          median: {},
          stdDev: {},
          correlations: {}
        },
        recommendations: [],
        visualizations: []
      };
    }

    // Detect patterns
    const patterns = await this.patternDetector.detectPatterns(data);
    
    // Calculate statistics
    const statistics = this.calculateStatistics(data);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(data, patterns);
    
    // Suggest visualizations
    const visualizations = this.suggestVisualizations(data, patterns);

    return {
      patterns,
      statistics,
      recommendations,
      visualizations
    };
  }

  private calculateStatistics(data: DataPoint[]): AnalysisResult['statistics'] {
    const numericColumns = this.getNumericColumns(data);
    const statistics = {
      mean: {} as Record<string, number>,
      median: {} as Record<string, number>,
      stdDev: {} as Record<string, number>,
      correlations: {} as Record<string, Record<string, number>>
    };

    // Calculate basic statistics for each numeric column
    for (const column of numericColumns) {
      const values = data.map(point => point.values[column] as number);
      
      statistics.mean[column] = ss.mean(values);
      statistics.median[column] = ss.median(values);
      statistics.stdDev[column] = ss.standardDeviation(values);
    }

    // Calculate correlations
    for (let i = 0; i < numericColumns.length; i++) {
      const col1 = numericColumns[i];
      statistics.correlations[col1] = {};
      
      for (let j = 0; j < numericColumns.length; j++) {
        const col2 = numericColumns[j];
        
        if (i === j) {
          statistics.correlations[col1][col2] = 1;
        } else {
          const values1 = data.map(point => point.values[col1] as number);
          const values2 = data.map(point => point.values[col2] as number);
          
          try {
            statistics.correlations[col1][col2] = ss.sampleCorrelation(values1, values2);
          } catch (error) {
            statistics.correlations[col1][col2] = 0;
          }
        }
      }
    }

    return statistics;
  }

  private generateRecommendations(data: DataPoint[], patterns: DataPattern[]): string[] {
    const recommendations: string[] = [];
    const numericColumns = this.getNumericColumns(data);

    // Recommendations based on data size
    if (data.length < 30) {
      recommendations.push("Consider collecting more data points for more reliable analysis");
    }

    // Recommendations based on patterns
    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'trend':
          if (pattern.confidence > 0.8) {
            const direction = pattern.parameters.direction;
            recommendations.push(
              `Strong ${direction} trend detected in ${pattern.affectedColumns.join(', ')}. ` +
              `Consider investigating the underlying causes.`
            );
          }
          break;

        case 'anomaly':
          if (pattern.parameters.percentage > 10) {
            recommendations.push(
              `High number of anomalies (${pattern.parameters.percentage.toFixed(1)}%) in ` +
              `${pattern.affectedColumns.join(', ')}. Consider data quality assessment.`
            );
          } else {
            recommendations.push(
              `Anomalies detected in ${pattern.affectedColumns.join(', ')}. ` +
              `These outliers may require special attention.`
            );
          }
          break;

        case 'correlation':
          if (pattern.confidence > 0.8) {
            recommendations.push(
              `Strong correlation found between ${pattern.affectedColumns.join(' and ')}. ` +
              `This relationship could be leveraged for predictive modeling.`
            );
          }
          break;

        case 'seasonal':
          recommendations.push(
            `Seasonal pattern detected in ${pattern.affectedColumns.join(', ')} ` +
            `with period ${pattern.parameters.period}. Consider seasonal adjustments in forecasting.`
          );
          break;

        case 'cluster':
          recommendations.push(
            `${pattern.parameters.k} distinct groups identified in the data. ` +
            `Consider segmented analysis or targeted strategies for each group.`
          );
          break;
      }
    }

    // Recommendations based on data characteristics
    if (numericColumns.length === 1) {
      recommendations.push("Single variable analysis. Consider adding related variables for deeper insights.");
    }

    if (numericColumns.length > 10) {
      recommendations.push("High-dimensional data detected. Consider dimensionality reduction techniques.");
    }

    // Missing data recommendations
    const missingDataColumns = this.findColumnsWithMissingData(data);
    if (missingDataColumns.length > 0) {
      recommendations.push(
        `Missing data detected in columns: ${missingDataColumns.join(', ')}. ` +
        `Consider imputation strategies or data collection improvements.`
      );
    }

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  private suggestVisualizations(data: DataPoint[], patterns: DataPattern[]): VisualizationConfig[] {
    const visualizations: VisualizationConfig[] = [];
    const numericColumns = this.getNumericColumns(data);
    const categoricalColumns = this.getCategoricalColumns(data);

    // Basic visualizations based on data structure
    if (numericColumns.length === 1) {
      // Single numeric variable
      visualizations.push({
        type: 'histogram',
        data,
        xAxis: numericColumns[0],
        title: `Distribution of ${numericColumns[0]}`
      });

      if (categoricalColumns.length > 0) {
        visualizations.push({
          type: 'box',
          data,
          yAxis: numericColumns[0],
          groupBy: categoricalColumns[0],
          title: `${numericColumns[0]} by ${categoricalColumns[0]}`
        });
      }
    }

    if (numericColumns.length >= 2) {
      // Multiple numeric variables
      visualizations.push({
        type: 'scatter',
        data,
        xAxis: numericColumns[0],
        yAxis: numericColumns[1],
        title: `${numericColumns[1]} vs ${numericColumns[0]}`,
        colorBy: categoricalColumns[0]
      });

      // Correlation heatmap
      if (numericColumns.length > 2) {
        visualizations.push({
          type: 'heatmap',
          data,
          title: 'Correlation Matrix'
        });
      }
    }

    // Pattern-specific visualizations
    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'trend':
          if (pattern.affectedColumns.length > 0) {
            visualizations.push({
              type: 'line',
              data,
              yAxis: pattern.affectedColumns[0],
              title: `Trend Analysis: ${pattern.affectedColumns[0]}`,
              xAxis: 'index'
            });
          }
          break;

        case 'seasonal':
          if (pattern.affectedColumns.length > 0) {
            visualizations.push({
              type: 'line',
              data,
              yAxis: pattern.affectedColumns[0],
              title: `Seasonal Pattern: ${pattern.affectedColumns[0]}`,
              xAxis: 'index'
            });
          }
          break;

        case 'correlation':
          if (pattern.affectedColumns.length === 2) {
            visualizations.push({
              type: 'scatter',
              data,
              xAxis: pattern.affectedColumns[0],
              yAxis: pattern.affectedColumns[1],
              title: `Correlation: ${pattern.affectedColumns.join(' vs ')}`
            });
          }
          break;
      }
    }

    // Time series visualizations if timestamp data exists
    if (this.hasTimeData(data)) {
      for (const column of numericColumns.slice(0, 3)) {
        visualizations.push({
          type: 'line',
          data,
          xAxis: 'timestamp',
          yAxis: column,
          title: `Time Series: ${column}`
        });
      }
    }

    // Remove duplicates and limit
    const uniqueVisualizations = visualizations.filter((viz, index, self) => 
      index === self.findIndex(v => 
        v.type === viz.type && 
        v.xAxis === viz.xAxis && 
        v.yAxis === viz.yAxis
      )
    );

    return uniqueVisualizations.slice(0, 8); // Limit to 8 visualizations
  }

  private getNumericColumns(data: DataPoint[]): string[] {
    if (data.length === 0) return [];
    
    const firstRow = data[0];
    return Object.keys(firstRow.values).filter(key => {
      return data.every(point => 
        typeof point.values[key] === 'number' && !isNaN(point.values[key] as number)
      );
    });
  }

  private getCategoricalColumns(data: DataPoint[]): string[] {
    if (data.length === 0) return [];
    
    const firstRow = data[0];
    return Object.keys(firstRow.values).filter(key => {
      const uniqueValues = new Set(data.map(point => point.values[key]));
      return uniqueValues.size < data.length * 0.5 && typeof firstRow.values[key] === 'string';
    });
  }

  private findColumnsWithMissingData(data: DataPoint[]): string[] {
    if (data.length === 0) return [];
    
    const firstRow = data[0];
    const columns = Object.keys(firstRow.values);
    
    return columns.filter(column => {
      return data.some(point => 
        point.values[column] === null || 
        point.values[column] === undefined || 
        point.values[column] === ''
      );
    });
  }

  private hasTimeData(data: DataPoint[]): boolean {
    if (data.length === 0) return false;
    
    // Check if data has timestamp information or sequential indices
    return data.every((point, index) => 
      point.timestamp !== undefined || 
      Object.keys(point.values).some(key => 
        key.toLowerCase().includes('time') || 
        key.toLowerCase().includes('date')
      )
    );
  }

  async generateInsights(data: DataPoint[], patterns: DataPattern[]): Promise<string[]> {
    const insights: string[] = [];
    
    // Data overview insights
    const numericColumns = this.getNumericColumns(data);
    const categoricalColumns = this.getCategoricalColumns(data);
    
    insights.push(`Dataset contains ${data.length} records with ${numericColumns.length} numeric and ${categoricalColumns.length} categorical variables.`);
    
    // Pattern-based insights
    const trendPatterns = patterns.filter(p => p.type === 'trend' && p.confidence > 0.7);
    const correlationPatterns = patterns.filter(p => p.type === 'correlation' && p.confidence > 0.7);
    const anomalyPatterns = patterns.filter(p => p.type === 'anomaly');
    
    if (trendPatterns.length > 0) {
      insights.push(`Strong trends identified in ${trendPatterns.length} variable(s), suggesting systematic changes over time.`);
    }
    
    if (correlationPatterns.length > 0) {
      insights.push(`${correlationPatterns.length} strong correlation(s) found, indicating potential relationships between variables.`);
    }
    
    if (anomalyPatterns.length > 0) {
      const totalAnomalies = anomalyPatterns.reduce((sum, p) => sum + p.parameters.count, 0);
      insights.push(`${totalAnomalies} anomalous data points detected across ${anomalyPatterns.length} variable(s).`);
    }
    
    return insights;
  }
}