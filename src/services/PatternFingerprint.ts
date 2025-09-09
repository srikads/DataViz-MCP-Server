import * as ss from 'simple-statistics';
import { createHash } from 'crypto';
import { DataPoint, DataPattern } from '../types/index.js';

interface StatisticalFingerprint {
  mean: number;
  std: number;
  skewness: number;
  kurtosis: number;
  entropy: number;
  quantiles: number[]; // [Q1, Q2, Q3, Q4]
  distribution_type: 'normal' | 'uniform' | 'exponential' | 'bimodal' | 'unknown';
}

interface TemporalFingerprint {
  seasonality_strength: number;
  trend_strength: number;
  autocorrelation_lags: number[];
  dominant_frequency: number;
  periodicity_score: number;
  stationarity_score: number;
}

interface RelationalFingerprint {
  correlation_matrix_hash: string;
  principal_components: number[];
  dependency_strength: number;
  mutual_information: Record<string, number>;
  network_centrality: Record<string, number>;
}

interface AnomalyFingerprint {
  outlier_positions: number[];
  outlier_severity: number[];
  anomaly_density: number;
  temporal_anomaly_clusters: Array<{ start: number; end: number; severity: number }>;
  anomaly_signature: string;
}

export interface PatternFingerprint {
  id: string;
  timestamp: number;
  data_hash: string;
  statistical: Record<string, StatisticalFingerprint>;
  temporal: TemporalFingerprint;
  relational: RelationalFingerprint;
  anomaly: AnomalyFingerprint;
  pattern_types: string[];
  confidence_scores: Record<string, number>;
  similarity_vector: number[];
}

export class PatternFingerprintGenerator {
  
  async generateFingerprint(
    data: DataPoint[], 
    patterns: DataPattern[],
    connectionId: string
  ): Promise<PatternFingerprint> {
    const dataHash = this.computeDataHash(data);
    const numericColumns = this.getNumericColumns(data);
    
    const fingerprint: PatternFingerprint = {
      id: `fingerprint_${connectionId}_${Date.now()}`,
      timestamp: Date.now(),
      data_hash: dataHash,
      statistical: {},
      temporal: await this.generateTemporalFingerprint(data, numericColumns),
      relational: await this.generateRelationalFingerprint(data, numericColumns),
      anomaly: await this.generateAnomalyFingerprint(data, numericColumns, patterns),
      pattern_types: patterns.map(p => p.type),
      confidence_scores: this.extractConfidenceScores(patterns),
      similarity_vector: []
    };

    // Generate statistical fingerprint for each numeric column
    for (const column of numericColumns) {
      const values = data.map(point => point.values[column] as number);
      fingerprint.statistical[column] = await this.generateStatisticalFingerprint(values);
    }

    // Generate similarity vector for pattern matching
    fingerprint.similarity_vector = this.generateSimilarityVector(fingerprint);

    return fingerprint;
  }

  private async generateStatisticalFingerprint(values: number[]): Promise<StatisticalFingerprint> {
    const mean = ss.mean(values);
    const std = ss.standardDeviation(values);
    const skewness = this.calculateSkewness(values, mean, std);
    const kurtosis = this.calculateKurtosis(values, mean, std);
    const entropy = this.calculateEntropy(values);
    
    const sorted = [...values].sort((a, b) => a - b);
    const quantiles = [
      ss.quantile(sorted, 0.25),
      ss.quantile(sorted, 0.5),
      ss.quantile(sorted, 0.75),
      ss.quantile(sorted, 1.0)
    ];

    const distribution_type = this.detectDistributionType(values, mean, std, skewness, kurtosis);

    return {
      mean,
      std,
      skewness,
      kurtosis,
      entropy,
      quantiles,
      distribution_type
    };
  }

  private async generateTemporalFingerprint(
    data: DataPoint[], 
    numericColumns: string[]
  ): Promise<TemporalFingerprint> {
    if (numericColumns.length === 0) {
      return {
        seasonality_strength: 0,
        trend_strength: 0,
        autocorrelation_lags: [],
        dominant_frequency: 0,
        periodicity_score: 0,
        stationarity_score: 0
      };
    }

    // Use first numeric column for temporal analysis
    const values = data.map(point => point.values[numericColumns[0]] as number);
    
    const seasonality_strength = this.calculateSeasonalityStrength(values);
    const trend_strength = this.calculateTrendStrength(values);
    const autocorrelation_lags = this.findSignificantLags(values);
    const dominant_frequency = this.findDominantFrequency(values);
    const periodicity_score = this.calculatePeriodicityScore(values);
    const stationarity_score = this.calculateStationarityScore(values);

    return {
      seasonality_strength,
      trend_strength,
      autocorrelation_lags,
      dominant_frequency,
      periodicity_score,
      stationarity_score
    };
  }

  private async generateRelationalFingerprint(
    data: DataPoint[], 
    numericColumns: string[]
  ): Promise<RelationalFingerprint> {
    if (numericColumns.length < 2) {
      return {
        correlation_matrix_hash: '',
        principal_components: [],
        dependency_strength: 0,
        mutual_information: {},
        network_centrality: {}
      };
    }

    // Calculate correlation matrix
    const correlationMatrix = this.calculateCorrelationMatrix(data, numericColumns);
    const correlation_matrix_hash = this.hashMatrix(correlationMatrix);
    
    // Principal component analysis (simplified)
    const principal_components = this.calculatePrincipalComponents(correlationMatrix);
    
    // Overall dependency strength
    const dependency_strength = this.calculateDependencyStrength(correlationMatrix);
    
    // Mutual information between variables
    const mutual_information = this.calculateMutualInformation(data, numericColumns);
    
    // Network centrality measures
    const network_centrality = this.calculateNetworkCentrality(correlationMatrix, numericColumns);

    return {
      correlation_matrix_hash,
      principal_components,
      dependency_strength,
      mutual_information,
      network_centrality
    };
  }

  private async generateAnomalyFingerprint(
    data: DataPoint[], 
    numericColumns: string[],
    patterns: DataPattern[]
  ): Promise<AnomalyFingerprint> {
    const outlier_positions: number[] = [];
    const outlier_severity: number[] = [];
    let anomaly_density = 0;

    if (numericColumns.length > 0) {
      // Find outliers using IQR method for first numeric column
      const values = data.map(point => point.values[numericColumns[0]] as number);
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = ss.quantile(sorted, 0.25);
      const q3 = ss.quantile(sorted, 0.75);
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (value < lowerBound || value > upperBound) {
          outlier_positions.push(i);
          const severity = Math.max(
            Math.abs(value - lowerBound) / iqr,
            Math.abs(value - upperBound) / iqr
          );
          outlier_severity.push(severity);
        }
      }

      anomaly_density = outlier_positions.length / values.length;
    }

    // Find temporal anomaly clusters
    const temporal_anomaly_clusters = this.findAnomalyClusters(outlier_positions, outlier_severity);
    
    // Create anomaly signature
    const anomaly_signature = this.createAnomalySignature(
      outlier_positions, 
      outlier_severity, 
      temporal_anomaly_clusters
    );

    return {
      outlier_positions,
      outlier_severity,
      anomaly_density,
      temporal_anomaly_clusters,
      anomaly_signature
    };
  }

  private calculateSkewness(values: number[], mean: number, std: number): number {
    if (std === 0) return 0;
    
    const n = values.length;
    const sumCubes = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0);
    
    return (n / ((n - 1) * (n - 2))) * sumCubes;
  }

  private calculateKurtosis(values: number[], mean: number, std: number): number {
    if (std === 0) return 0;
    
    const n = values.length;
    const sumFourths = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0);
    
    const kurtosis = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sumFourths;
    return kurtosis - (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
  }

  private calculateEntropy(values: number[]): number {
    // Discretize values into bins for entropy calculation
    const bins = 10;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / bins;
    
    if (binSize === 0) return 0;
    
    const binCounts = new Array(bins).fill(0);
    
    for (const value of values) {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      binCounts[binIndex]++;
    }
    
    let entropy = 0;
    for (const count of binCounts) {
      if (count > 0) {
        const probability = count / values.length;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    return entropy;
  }

  private detectDistributionType(
    values: number[], 
    mean: number, 
    std: number, 
    skewness: number, 
    kurtosis: number
  ): 'normal' | 'uniform' | 'exponential' | 'bimodal' | 'unknown' {
    // Simplified distribution detection
    if (Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 1) {
      return 'normal';
    } else if (Math.abs(skewness) < 0.2 && Math.abs(kurtosis + 1.2) < 0.5) {
      return 'uniform';
    } else if (skewness > 1 && kurtosis > 2) {
      return 'exponential';
    } else if (kurtosis < -1) {
      return 'bimodal';
    }
    
    return 'unknown';
  }

  private calculateSeasonalityStrength(values: number[]): number {
    if (values.length < 24) return 0; // Need sufficient data for seasonality
    
    // Test common seasonal periods
    const periods = [7, 12, 24, 30, 365]; // daily, monthly, hourly, etc.
    let maxSeasonality = 0;
    
    for (const period of periods) {
      if (period < values.length / 2) {
        const seasonality = this.autocorrelation(values, period);
        maxSeasonality = Math.max(maxSeasonality, Math.abs(seasonality));
      }
    }
    
    return maxSeasonality;
  }

  private calculateTrendStrength(values: number[]): number {
    if (values.length < 3) return 0;
    
    const indices = values.map((_, i) => i);
    const regression = ss.linearRegression(indices.map((x, i) => [x, values[i]]));
    const rSquared = ss.rSquared(indices.map((x, i) => [x, values[i]]), regression);
    
    return rSquared;
  }

  private findSignificantLags(values: number[]): number[] {
    const maxLag = Math.min(50, Math.floor(values.length / 4));
    const significantLags: number[] = [];
    
    for (let lag = 1; lag <= maxLag; lag++) {
      const correlation = Math.abs(this.autocorrelation(values, lag));
      if (correlation > 0.3) { // Threshold for significant correlation
        significantLags.push(lag);
      }
    }
    
    return significantLags.slice(0, 10); // Return top 10 lags
  }

  private findDominantFrequency(values: number[]): number {
    // Simplified frequency analysis using autocorrelation
    const maxLag = Math.min(values.length / 2, 100);
    let maxCorr = 0;
    let dominantPeriod = 0;
    
    for (let lag = 2; lag < maxLag; lag++) {
      const corr = Math.abs(this.autocorrelation(values, lag));
      if (corr > maxCorr) {
        maxCorr = corr;
        dominantPeriod = lag;
      }
    }
    
    return dominantPeriod > 0 ? 1 / dominantPeriod : 0;
  }

  private calculatePeriodicityScore(values: number[]): number {
    // Measure how periodic the time series is
    const significantLags = this.findSignificantLags(values);
    
    if (significantLags.length === 0) return 0;
    
    // Check for regular spacing in significant lags
    const spacings = significantLags.slice(1).map((lag, i) => lag - significantLags[i]);
    const avgSpacing = ss.mean(spacings);
    const spacingVariance = ss.variance(spacings);
    
    // Lower variance in spacing indicates more regular periodicity
    return avgSpacing > 0 ? 1 / (1 + spacingVariance / (avgSpacing * avgSpacing)) : 0;
  }

  private calculateStationarityScore(values: number[]): number {
    // Simplified stationarity test using variance of rolling means
    const windowSize = Math.max(10, Math.floor(values.length / 10));
    const rollingMeans: number[] = [];
    
    for (let i = 0; i <= values.length - windowSize; i++) {
      const window = values.slice(i, i + windowSize);
      rollingMeans.push(ss.mean(window));
    }
    
    if (rollingMeans.length < 2) return 1;
    
    const meanVariance = ss.variance(rollingMeans);
    const overallMean = ss.mean(values);
    
    // Lower variance in rolling means indicates more stationarity
    return 1 / (1 + meanVariance / (overallMean * overallMean));
  }

  private autocorrelation(values: number[], lag: number): number {
    if (lag >= values.length) return 0;
    
    const n = values.length;
    const mean = ss.mean(values);
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    for (let i = 0; i < n; i++) {
      denominator += (values[i] - mean) * (values[i] - mean);
    }
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateCorrelationMatrix(data: DataPoint[], columns: string[]): number[][] {
    const matrix: number[][] = [];
    
    for (let i = 0; i < columns.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < columns.length; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          const values1 = data.map(point => point.values[columns[i]] as number);
          const values2 = data.map(point => point.values[columns[j]] as number);
          
          try {
            matrix[i][j] = ss.sampleCorrelation(values1, values2);
          } catch {
            matrix[i][j] = 0;
          }
        }
      }
    }
    
    return matrix;
  }

  private hashMatrix(matrix: number[][]): string {
    const matrixString = matrix.map(row => 
      row.map(val => val.toFixed(3)).join(',')
    ).join(';');
    
    return createHash('sha256').update(matrixString).digest('hex').substring(0, 16);
  }

  private calculatePrincipalComponents(correlationMatrix: number[][]): number[] {
    // Simplified PC calculation - return diagonal values as approximation
    return correlationMatrix.map((row, i) => row[i]);
  }

  private calculateDependencyStrength(correlationMatrix: number[][]): number {
    const n = correlationMatrix.length;
    if (n < 2) return 0;
    
    let sumAbsCorr = 0;
    let count = 0;
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        sumAbsCorr += Math.abs(correlationMatrix[i][j]);
        count++;
      }
    }
    
    return count > 0 ? sumAbsCorr / count : 0;
  }

  private calculateMutualInformation(data: DataPoint[], columns: string[]): Record<string, number> {
    const mutualInfo: Record<string, number> = {};
    
    for (let i = 0; i < columns.length; i++) {
      for (let j = i + 1; j < columns.length; j++) {
        const col1 = columns[i];
        const col2 = columns[j];
        
        // Simplified mutual information calculation
        const values1 = data.map(point => point.values[col1] as number);
        const values2 = data.map(point => point.values[col2] as number);
        
        const correlation = Math.abs(ss.sampleCorrelation(values1, values2) || 0);
        mutualInfo[`${col1}-${col2}`] = correlation; // Approximation
      }
    }
    
    return mutualInfo;
  }

  private calculateNetworkCentrality(
    correlationMatrix: number[][], 
    columns: string[]
  ): Record<string, number> {
    const centrality: Record<string, number> = {};
    
    for (let i = 0; i < columns.length; i++) {
      // Degree centrality - sum of absolute correlations
      const degree = correlationMatrix[i].reduce((sum, corr, j) => 
        i !== j ? sum + Math.abs(corr) : sum, 0
      );
      
      centrality[columns[i]] = degree / (columns.length - 1);
    }
    
    return centrality;
  }

  private findAnomalyClusters(
    positions: number[], 
    severities: number[]
  ): Array<{ start: number; end: number; severity: number }> {
    if (positions.length === 0) return [];
    
    const clusters: Array<{ start: number; end: number; severity: number }> = [];
    let currentCluster = { start: positions[0], end: positions[0], severity: severities[0] };
    
    for (let i = 1; i < positions.length; i++) {
      if (positions[i] - currentCluster.end <= 5) { // Within 5 positions
        currentCluster.end = positions[i];
        currentCluster.severity = Math.max(currentCluster.severity, severities[i]);
      } else {
        clusters.push(currentCluster);
        currentCluster = { start: positions[i], end: positions[i], severity: severities[i] };
      }
    }
    
    clusters.push(currentCluster);
    return clusters.filter(cluster => cluster.severity > 1.5); // Only significant clusters
  }

  private createAnomalySignature(
    positions: number[], 
    severities: number[], 
    clusters: Array<{ start: number; end: number; severity: number }>
  ): string {
    const signature = {
      total_anomalies: positions.length,
      max_severity: Math.max(...severities, 0),
      avg_severity: severities.length > 0 ? ss.mean(severities) : 0,
      cluster_count: clusters.length,
      max_cluster_severity: clusters.length > 0 ? Math.max(...clusters.map(c => c.severity)) : 0
    };
    
    return createHash('md5').update(JSON.stringify(signature)).digest('hex').substring(0, 12);
  }

  private computeDataHash(data: DataPoint[]): string {
    // Create a hash of the data structure and key statistics
    const hashData = {
      length: data.length,
      columns: data.length > 0 ? Object.keys(data[0].values).sort() : [],
      sample_checksums: data.slice(0, 10).map(point => 
        Object.values(point.values).join('|')
      )
    };
    
    return createHash('sha256').update(JSON.stringify(hashData)).digest('hex').substring(0, 16);
  }

  private extractConfidenceScores(patterns: DataPattern[]): Record<string, number> {
    const scores: Record<string, number> = {};
    
    for (const pattern of patterns) {
      scores[pattern.type] = pattern.confidence;
    }
    
    return scores;
  }

  private generateSimilarityVector(fingerprint: PatternFingerprint): number[] {
    // Create a normalized vector for pattern similarity comparison
    const vector: number[] = [];
    
    // Add statistical features (mean, std, skewness, kurtosis for each column)
    for (const [_, stats] of Object.entries(fingerprint.statistical)) {
      vector.push(
        this.normalize(stats.mean, -10, 10),
        this.normalize(stats.std, 0, 10),
        this.normalize(stats.skewness, -3, 3),
        this.normalize(stats.kurtosis, -3, 3),
        this.normalize(stats.entropy, 0, 4)
      );
    }
    
    // Add temporal features
    vector.push(
      fingerprint.temporal.seasonality_strength,
      fingerprint.temporal.trend_strength,
      fingerprint.temporal.periodicity_score,
      fingerprint.temporal.stationarity_score
    );
    
    // Add relational features
    vector.push(
      fingerprint.relational.dependency_strength,
      fingerprint.relational.principal_components.length > 0 ? 
        ss.mean(fingerprint.relational.principal_components) : 0
    );
    
    // Add anomaly features
    vector.push(
      fingerprint.anomaly.anomaly_density,
      fingerprint.anomaly.outlier_severity.length > 0 ? 
        ss.mean(fingerprint.anomaly.outlier_severity) : 0
    );
    
    // Add pattern type indicators
    const patternTypes = ['trend', 'seasonal', 'correlation', 'cluster', 'anomaly'];
    for (const type of patternTypes) {
      vector.push(fingerprint.pattern_types.includes(type) ? 1 : 0);
    }
    
    return vector;
  }

  private normalize(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
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

  // Pattern similarity calculation
  calculateSimilarity(fingerprint1: PatternFingerprint, fingerprint2: PatternFingerprint): number {
    if (fingerprint1.similarity_vector.length !== fingerprint2.similarity_vector.length) {
      return 0;
    }
    
    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < fingerprint1.similarity_vector.length; i++) {
      const v1 = fingerprint1.similarity_vector[i];
      const v2 = fingerprint2.similarity_vector[i];
      
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }
    
    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // Find similar patterns
  findSimilarPatterns(
    targetFingerprint: PatternFingerprint, 
    candidateFingerprints: PatternFingerprint[],
    threshold: number = 0.7
  ): Array<{ fingerprint: PatternFingerprint; similarity: number }> {
    const similarities = candidateFingerprints.map(candidate => ({
      fingerprint: candidate,
      similarity: this.calculateSimilarity(targetFingerprint, candidate)
    }));
    
    return similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);
  }
}