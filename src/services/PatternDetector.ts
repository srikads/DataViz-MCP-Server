import { Matrix } from 'ml-matrix';
import * as ss from 'simple-statistics';
import { DataPoint, DataPattern } from '../types/index.js';

export class PatternDetector {
  
  async detectPatterns(data: DataPoint[]): Promise<DataPattern[]> {
    const patterns: DataPattern[] = [];
    
    if (data.length === 0) return patterns;

    const numericColumns = this.getNumericColumns(data);
    
    patterns.push(...await this.detectTrends(data, numericColumns));
    patterns.push(...await this.detectAnomalies(data, numericColumns));
    patterns.push(...await this.detectCorrelations(data, numericColumns));
    patterns.push(...await this.detectClusters(data, numericColumns));
    patterns.push(...await this.detectSeasonality(data, numericColumns));
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
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

  private async detectTrends(data: DataPoint[], numericColumns: string[]): Promise<DataPattern[]> {
    const patterns: DataPattern[] = [];
    
    for (const column of numericColumns) {
      const values = data.map(point => point.values[column] as number);
      const indices = values.map((_, i) => i);
      
      try {
        const regression = ss.linearRegression(indices.map((x, i) => [x, values[i]]));
        const slope = regression.m;
        const rSquared = ss.rSquared(indices.map((x, i) => [x, values[i]]), regression);
        
        if (Math.abs(slope) > 0.1 && rSquared > 0.5) {
          patterns.push({
            type: 'trend',
            confidence: rSquared,
            description: `${slope > 0 ? 'Increasing' : 'Decreasing'} trend in ${column}`,
            parameters: {
              slope,
              rSquared,
              direction: slope > 0 ? 'increasing' : 'decreasing'
            },
            affectedColumns: [column]
          });
        }
      } catch (error) {
        // Skip if regression fails
      }
    }
    
    return patterns;
  }

  private async detectAnomalies(data: DataPoint[], numericColumns: string[]): Promise<DataPattern[]> {
    const patterns: DataPattern[] = [];
    
    for (const column of numericColumns) {
      const values = data.map(point => point.values[column] as number);
      const mean = ss.mean(values);
      const stdDev = ss.standardDeviation(values);
      const threshold = 2; // 2 standard deviations
      
      const anomalies = data.filter((point, index) => {
        const value = point.values[column] as number;
        return Math.abs(value - mean) > threshold * stdDev;
      });
      
      if (anomalies.length > 0) {
        const confidence = Math.min(0.9, anomalies.length / data.length * 5);
        
        patterns.push({
          type: 'anomaly',
          confidence,
          description: `${anomalies.length} anomalous values detected in ${column}`,
          parameters: {
            count: anomalies.length,
            percentage: (anomalies.length / data.length) * 100,
            threshold,
            mean,
            stdDev
          },
          affectedColumns: [column]
        });
      }
    }
    
    return patterns;
  }

  private async detectCorrelations(data: DataPoint[], numericColumns: string[]): Promise<DataPattern[]> {
    const patterns: DataPattern[] = [];
    
    if (numericColumns.length < 2) return patterns;
    
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        
        const values1 = data.map(point => point.values[col1] as number);
        const values2 = data.map(point => point.values[col2] as number);
        
        try {
          const correlation = ss.sampleCorrelation(values1, values2);
          
          if (Math.abs(correlation) > 0.7) {
            patterns.push({
              type: 'correlation',
              confidence: Math.abs(correlation),
              description: `${correlation > 0 ? 'Positive' : 'Negative'} correlation between ${col1} and ${col2}`,
              parameters: {
                correlation,
                strength: Math.abs(correlation) > 0.9 ? 'very strong' : 'strong',
                direction: correlation > 0 ? 'positive' : 'negative'
              },
              affectedColumns: [col1, col2]
            });
          }
        } catch (error) {
          // Skip if correlation calculation fails
        }
      }
    }
    
    return patterns;
  }

  private async detectClusters(data: DataPoint[], numericColumns: string[]): Promise<DataPattern[]> {
    const patterns: DataPattern[] = [];
    
    if (numericColumns.length < 2 || data.length < 10) return patterns;
    
    // Simple k-means clustering implementation
    try {
      const matrix = this.createMatrix(data, numericColumns);
      const clusters = await this.kMeansClustering(matrix, 3);
      
      if (clusters.silhouetteScore > 0.5) {
        patterns.push({
          type: 'cluster',
          confidence: clusters.silhouetteScore,
          description: `${clusters.k} distinct clusters found in the data`,
          parameters: {
            k: clusters.k,
            silhouetteScore: clusters.silhouetteScore,
            clusterSizes: clusters.clusterSizes
          },
          affectedColumns: numericColumns
        });
      }
    } catch (error) {
      // Skip if clustering fails
    }
    
    return patterns;
  }

  private async detectSeasonality(data: DataPoint[], numericColumns: string[]): Promise<DataPattern[]> {
    const patterns: DataPattern[] = [];
    
    if (data.length < 50) return patterns; // Need enough data points
    
    for (const column of numericColumns) {
      const values = data.map(point => point.values[column] as number);
      
      // Simple seasonal detection using autocorrelation
      const seasonality = this.detectSeasonalityInSeries(values);
      
      if (seasonality.confidence > 0.6) {
        patterns.push({
          type: 'seasonal',
          confidence: seasonality.confidence,
          description: `Seasonal pattern detected in ${column} with period ${seasonality.period}`,
          parameters: {
            period: seasonality.period,
            amplitude: seasonality.amplitude
          },
          affectedColumns: [column]
        });
      }
    }
    
    return patterns;
  }

  private createMatrix(data: DataPoint[], columns: string[]): number[][] {
    return data.map(point => 
      columns.map(col => point.values[col] as number)
    );
  }

  private async kMeansClustering(data: number[][], k: number): Promise<{
    k: number;
    silhouetteScore: number;
    clusterSizes: number[];
  }> {
    // Simplified k-means implementation
    const n = data.length;
    const d = data[0].length;
    
    // Initialize centroids randomly
    let centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * n);
      centroids.push([...data[randomIndex]]);
    }
    
    let assignments = new Array(n).fill(0);
    let changed = true;
    let iterations = 0;
    
    while (changed && iterations < 100) {
      changed = false;
      iterations++;
      
      // Assign points to closest centroid
      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        let newAssignment = 0;
        
        for (let j = 0; j < k; j++) {
          const dist = this.euclideanDistance(data[i], centroids[j]);
          if (dist < minDist) {
            minDist = dist;
            newAssignment = j;
          }
        }
        
        if (assignments[i] !== newAssignment) {
          assignments[i] = newAssignment;
          changed = true;
        }
      }
      
      // Update centroids
      for (let j = 0; j < k; j++) {
        const clusterPoints = data.filter((_, i) => assignments[i] === j);
        if (clusterPoints.length > 0) {
          for (let dim = 0; dim < d; dim++) {
            centroids[j][dim] = ss.mean(clusterPoints.map(p => p[dim]));
          }
        }
      }
    }
    
    // Calculate cluster sizes
    const clusterSizes = new Array(k).fill(0);
    assignments.forEach(assignment => clusterSizes[assignment]++);
    
    // Calculate silhouette score (simplified)
    const silhouetteScore = this.calculateSilhouetteScore(data, assignments, centroids);
    
    return { k, silhouetteScore, clusterSizes };
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  private calculateSilhouetteScore(data: number[][], assignments: number[], centroids: number[][]): number {
    // Simplified silhouette score calculation
    let totalScore = 0;
    const n = data.length;
    
    for (let i = 0; i < n; i++) {
      const clusterIndex = assignments[i];
      const a = this.euclideanDistance(data[i], centroids[clusterIndex]);
      
      let minB = Infinity;
      for (let j = 0; j < centroids.length; j++) {
        if (j !== clusterIndex) {
          const b = this.euclideanDistance(data[i], centroids[j]);
          if (b < minB) minB = b;
        }
      }
      
      const silhouette = (minB - a) / Math.max(a, minB);
      totalScore += silhouette;
    }
    
    return Math.max(0, totalScore / n);
  }

  private detectSeasonalityInSeries(values: number[]): { confidence: number; period: number; amplitude: number } {
    // Simplified seasonality detection using autocorrelation
    const n = values.length;
    const maxPeriod = Math.min(Math.floor(n / 4), 50);
    
    let bestPeriod = 0;
    let bestCorrelation = 0;
    
    for (let period = 2; period <= maxPeriod; period++) {
      const correlation = this.autocorrelation(values, period);
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    const amplitude = ss.standardDeviation(values);
    
    return {
      confidence: bestCorrelation,
      period: bestPeriod,
      amplitude
    };
  }

  private autocorrelation(values: number[], lag: number): number {
    const n = values.length;
    if (lag >= n) return 0;
    
    const mean = ss.mean(values);
    const numerator = values.slice(0, n - lag).reduce((sum, val, i) => {
      return sum + (val - mean) * (values[i + lag] - mean);
    }, 0);
    
    const denominator = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
}