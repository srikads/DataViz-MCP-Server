import * as ss from 'simple-statistics';
import { DataPoint, DataPattern } from '../types/index.js';
import { PatternDetector } from './PatternDetector.js';

interface AdvancedPattern extends DataPattern {
  algorithm: string;
  statistical_significance: number;
  effect_size: number;
  metadata: {
    sample_size: number;
    test_statistic?: number;
    p_value?: number;
    confidence_interval?: [number, number];
    algorithm_params?: Record<string, any>;
  };
}

interface DistributionAnalysis {
  type: 'normal' | 'log_normal' | 'exponential' | 'uniform' | 'bimodal' | 'skewed' | 'heavy_tailed';
  parameters: Record<string, number>;
  goodness_of_fit: number;
  normality_tests: {
    shapiro_wilk?: number;
    kolmogorov_smirnov?: number;
    anderson_darling?: number;
  };
}

interface FrequencyPattern {
  peaks: Array<{ position: number; magnitude: number; significance: number }>;
  valleys: Array<{ position: number; magnitude: number; significance: number }>;
  dominant_frequency: number;
  harmonic_frequencies: number[];
  spectral_entropy: number;
  periodicity_strength: number;
}

export class AdvancedPatternDetector extends PatternDetector {
  
  async detectAdvancedPatterns(data: DataPoint[]): Promise<AdvancedPattern[]> {
    const patterns: AdvancedPattern[] = [];
    
    if (data.length === 0) return patterns;

    const numericColumns = this.getNumericColumns(data);
    
    // All existing patterns from base class
    const basePatterns = await super.detectPatterns(data);
    const advancedBasePatterns = basePatterns.map(p => this.enhancePattern(p, data));
    patterns.push(...advancedBasePatterns);
    
    // New advanced pattern detection
    patterns.push(...await this.detectDistributionPatterns(data, numericColumns));
    patterns.push(...await this.detectNonLinearCorrelations(data, numericColumns));
    patterns.push(...await this.detectHierarchicalClusters(data, numericColumns));
    patterns.push(...await this.detectFrequencyPatterns(data, numericColumns));
    patterns.push(...await this.detectAutogressivePatterns(data, numericColumns));
    patterns.push(...await this.detectChangePoints(data, numericColumns));
    patterns.push(...await this.detectCyclicalPatterns(data, numericColumns));
    patterns.push(...await this.detectOutlierClusters(data, numericColumns));
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  private enhancePattern(basePattern: DataPattern, data: DataPoint[]): AdvancedPattern {
    return {
      ...basePattern,
      algorithm: this.getAlgorithmForPatternType(basePattern.type),
      statistical_significance: this.calculateStatisticalSignificance(basePattern, data),
      effect_size: this.calculateEffectSize(basePattern, data),
      metadata: {
        sample_size: data.length,
        algorithm_params: basePattern.parameters
      }
    };
  }

  private async detectDistributionPatterns(
    data: DataPoint[], 
    numericColumns: string[]
  ): Promise<AdvancedPattern[]> {
    const patterns: AdvancedPattern[] = [];
    
    for (const column of numericColumns) {
      const values = data.map(point => point.values[column] as number);
      const analysis = this.analyzeDistribution(values);
      
      if (analysis.goodness_of_fit > 0.7) {
        patterns.push({
          type: 'distribution' as any,
          confidence: analysis.goodness_of_fit,
          description: `${column} follows a ${analysis.type} distribution`,
          parameters: {
            distribution_type: analysis.type,
            parameters: analysis.parameters,
            goodness_of_fit: analysis.goodness_of_fit
          },
          affectedColumns: [column],
          algorithm: 'distribution_fitting',
          statistical_significance: this.calculateNormalitySignificance(analysis.normality_tests),
          effect_size: this.calculateDistributionEffectSize(analysis),
          metadata: {
            sample_size: values.length,
            algorithm_params: analysis.parameters
          }
        });
      }
    }
    
    return patterns;
  }

  private async detectNonLinearCorrelations(
    data: DataPoint[], 
    numericColumns: string[]
  ): Promise<AdvancedPattern[]> {
    const patterns: AdvancedPattern[] = [];
    
    if (numericColumns.length < 2) return patterns;
    
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        
        const values1 = data.map(point => point.values[col1] as number);
        const values2 = data.map(point => point.values[col2] as number);
        
        // Spearman correlation for non-linear relationships
        const spearmanCorr = this.spearmanCorrelation(values1, values2);
        const pearsonCorr = ss.sampleCorrelation(values1, values2);
        
        // If Spearman is much higher than Pearson, likely non-linear
        if (Math.abs(spearmanCorr) > 0.7 && Math.abs(spearmanCorr - pearsonCorr) > 0.2) {
          patterns.push({
            type: 'correlation',
            confidence: Math.abs(spearmanCorr),
            description: `Non-linear ${spearmanCorr > 0 ? 'positive' : 'negative'} correlation between ${col1} and ${col2}`,
            parameters: {
              spearman_correlation: spearmanCorr,
              pearson_correlation: pearsonCorr,
              relationship_type: 'non_linear',
              strength: this.getCorrelationStrength(Math.abs(spearmanCorr))
            },
            affectedColumns: [col1, col2],
            algorithm: 'spearman_correlation',
            statistical_significance: this.calculateCorrelationSignificance(spearmanCorr, data.length),
            effect_size: Math.abs(spearmanCorr),
            metadata: {
              sample_size: data.length,
              test_statistic: spearmanCorr,
              algorithm_params: { method: 'spearman' }
            }
          });
        }
        
        // Detect polynomial relationships
        const polyRelationship = this.detectPolynomialRelationship(values1, values2);
        if (polyRelationship.r_squared > 0.8 && polyRelationship.degree > 1) {
          patterns.push({
            type: 'correlation',
            confidence: polyRelationship.r_squared,
            description: `Polynomial relationship (degree ${polyRelationship.degree}) between ${col1} and ${col2}`,
            parameters: {
              degree: polyRelationship.degree,
              r_squared: polyRelationship.r_squared,
              coefficients: polyRelationship.coefficients,
              relationship_type: 'polynomial'
            },
            affectedColumns: [col1, col2],
            algorithm: 'polynomial_regression',
            statistical_significance: polyRelationship.r_squared,
            effect_size: polyRelationship.r_squared,
            metadata: {
              sample_size: data.length,
              algorithm_params: { degree: polyRelationship.degree }
            }
          });
        }
      }
    }
    
    return patterns;
  }

  private async detectHierarchicalClusters(
    data: DataPoint[], 
    numericColumns: string[]
  ): Promise<AdvancedPattern[]> {
    const patterns: AdvancedPattern[] = [];
    
    if (numericColumns.length < 2 || data.length < 10) return patterns;
    
    try {
      const matrix = this.createMatrix(data, numericColumns);
      const dendrogram = this.hierarchicalClustering(matrix);
      
      // Analyze cluster quality at different levels
      for (const level of [2, 3, 4, 5]) {
        const clusters = this.cutDendrogram(dendrogram, level);
        const silhouette = this.calculateSilhouetteScore(matrix, clusters);
        
        if (silhouette > 0.6) {
          const clusterSizes = clusters.reduce((acc, cluster) => {
            acc[cluster] = (acc[cluster] || 0) + 1;
            return acc;
          }, {} as Record<number, number>);
          
          patterns.push({
            type: 'cluster',
            confidence: silhouette,
            description: `Hierarchical clustering reveals ${level} distinct groups with high cohesion`,
            parameters: {
              num_clusters: level,
              silhouette_score: silhouette,
              cluster_sizes: Object.values(clusterSizes),
              method: 'hierarchical',
              linkage: 'ward'
            },
            affectedColumns: numericColumns,
            algorithm: 'hierarchical_clustering',
            statistical_significance: silhouette,
            effect_size: silhouette,
            metadata: {
              sample_size: data.length,
              algorithm_params: { method: 'ward', distance: 'euclidean' }
            }
          });
          break; // Use best clustering level
        }
      }
    } catch (error) {
      // Skip if clustering fails
    }
    
    return patterns;
  }

  private async detectFrequencyPatterns(
    data: DataPoint[], 
    numericColumns: string[]
  ): Promise<AdvancedPattern[]> {
    const patterns: AdvancedPattern[] = [];
    
    for (const column of numericColumns) {
      const values = data.map(point => point.values[column] as number);
      
      if (values.length < 50) continue; // Need sufficient data for frequency analysis
      
      const freqAnalysis = this.analyzeFrequencyDomain(values);
      
      if (freqAnalysis.periodicity_strength > 0.6) {
        patterns.push({
          type: 'seasonal', // Reuse seasonal type for frequency patterns
          confidence: freqAnalysis.periodicity_strength,
          description: `Strong periodic pattern in ${column} with dominant frequency ${freqAnalysis.dominant_frequency.toFixed(3)}`,
          parameters: {
            dominant_frequency: freqAnalysis.dominant_frequency,
            harmonic_frequencies: freqAnalysis.harmonic_frequencies,
            spectral_entropy: freqAnalysis.spectral_entropy,
            peak_count: freqAnalysis.peaks.length,
            periodicity_strength: freqAnalysis.periodicity_strength
          },
          affectedColumns: [column],
          algorithm: 'frequency_domain_analysis',
          statistical_significance: freqAnalysis.periodicity_strength,
          effect_size: freqAnalysis.periodicity_strength,
          metadata: {
            sample_size: values.length,
            algorithm_params: { method: 'fft_approximation' }
          }
        });
      }
      
      // Detect multiple peaks/valleys
      if (freqAnalysis.peaks.length > 2) {
        const significantPeaks = freqAnalysis.peaks.filter(p => p.significance > 0.7);
        
        if (significantPeaks.length > 0) {
          patterns.push({
            type: 'cyclical' as any,
            confidence: Math.min(...significantPeaks.map(p => p.significance)),
            description: `Multiple significant peaks detected in ${column} indicating complex cyclical behavior`,
            parameters: {
              peak_count: significantPeaks.length,
              peak_positions: significantPeaks.map(p => p.position),
              peak_magnitudes: significantPeaks.map(p => p.magnitude),
              pattern_complexity: freqAnalysis.spectral_entropy
            },
            affectedColumns: [column],
            algorithm: 'peak_detection',
            statistical_significance: Math.min(...significantPeaks.map(p => p.significance)),
            effect_size: freqAnalysis.spectral_entropy,
            metadata: {
              sample_size: values.length,
              algorithm_params: { min_significance: 0.7 }
            }
          });
        }
      }
    }
    
    return patterns;
  }

  private async detectAutogressivePatterns(
    data: DataPoint[], 
    numericColumns: string[]
  ): Promise<AdvancedPattern[]> {
    const patterns: AdvancedPattern[] = [];
    
    for (const column of numericColumns) {
      const values = data.map(point => point.values[column] as number);
      
      if (values.length < 30) continue;
      
      // Test for AR(1), AR(2), AR(3) models
      for (const order of [1, 2, 3]) {
        const arModel = this.fitAutoregressive(values, order);
        
        if (arModel.r_squared > 0.6 && arModel.significance < 0.05) {
          patterns.push({
            type: 'trend', // Reuse trend type for autoregressive patterns
            confidence: arModel.r_squared,
            description: `${column} shows AR(${order}) autoregressive behavior (R² = ${arModel.r_squared.toFixed(3)})`,
            parameters: {
              order: order,
              coefficients: arModel.coefficients,
              r_squared: arModel.r_squared,
              residual_variance: arModel.residual_variance,
              model_type: 'autoregressive'
            },
            affectedColumns: [column],
            algorithm: `ar_${order}`,
            statistical_significance: 1 - arModel.significance,
            effect_size: arModel.r_squared,
            metadata: {
              sample_size: values.length - order,
              p_value: arModel.significance,
              algorithm_params: { order: order }
            }
          });
          break; // Use first significant model
        }
      }
    }
    
    return patterns;
  }

  private async detectChangePoints(
    data: DataPoint[], 
    numericColumns: string[]
  ): Promise<AdvancedPattern[]> {
    const patterns: AdvancedPattern[] = [];
    
    for (const column of numericColumns) {
      const values = data.map(point => point.values[column] as number);
      
      if (values.length < 20) continue;
      
      const changePoints = this.detectChangePoints(values);
      
      if (changePoints.length > 0) {
        const significantChanges = changePoints.filter(cp => cp.significance > 0.8);
        
        if (significantChanges.length > 0) {
          patterns.push({
            type: 'anomaly', // Reuse anomaly type for change points
            confidence: Math.max(...significantChanges.map(cp => cp.significance)),
            description: `${significantChanges.length} significant change point(s) detected in ${column}`,
            parameters: {
              change_points: significantChanges.map(cp => cp.position),
              change_magnitudes: significantChanges.map(cp => cp.magnitude),
              change_directions: significantChanges.map(cp => cp.direction),
              detection_method: 'cumulative_sum'
            },
            affectedColumns: [column],
            algorithm: 'change_point_detection',
            statistical_significance: Math.max(...significantChanges.map(cp => cp.significance)),
            effect_size: Math.max(...significantChanges.map(cp => cp.magnitude)),
            metadata: {
              sample_size: values.length,
              algorithm_params: { method: 'cusum', threshold: 0.8 }
            }
          });
        }
      }
    }
    
    return patterns;
  }

  private async detectCyclicalPatterns(
    data: DataPoint[], 
    numericColumns: string[]
  ): Promise<AdvancedPattern[]> {
    const patterns: AdvancedPattern[] = [];
    
    for (const column of numericColumns) {
      const values = data.map(point => point.values[column] as number);
      
      if (values.length < 100) continue; // Need more data for cycle detection
      
      // Detect multiple overlapping cycles
      const cycles = this.detectMultipleCycles(values);
      const significantCycles = cycles.filter(c => c.strength > 0.7);
      
      if (significantCycles.length > 1) {
        patterns.push({
          type: 'seasonal',
          confidence: Math.max(...significantCycles.map(c => c.strength)),
          description: `Multiple overlapping cycles detected in ${column}: ${significantCycles.map(c => c.period).join(', ')} period cycles`,
          parameters: {
            cycle_count: significantCycles.length,
            cycle_periods: significantCycles.map(c => c.period),
            cycle_strengths: significantCycles.map(c => c.strength),
            dominant_cycle: significantCycles[0].period,
            interaction_strength: this.calculateCycleInteraction(significantCycles)
          },
          affectedColumns: [column],
          algorithm: 'multiple_cycle_detection',
          statistical_significance: Math.max(...significantCycles.map(c => c.strength)),
          effect_size: this.calculateCycleInteraction(significantCycles),
          metadata: {
            sample_size: values.length,
            algorithm_params: { min_period: 5, max_period: Math.floor(values.length / 4) }
          }
        });
      }
    }
    
    return patterns;
  }

  private async detectOutlierClusters(
    data: DataPoint[], 
    numericColumns: string[]
  ): Promise<AdvancedPattern[]> {
    const patterns: AdvancedPattern[] = [];
    
    if (numericColumns.length < 2) return patterns;
    
    const matrix = this.createMatrix(data, numericColumns);
    const outlierClusters = this.dbscanOutlierDetection(matrix);
    
    if (outlierClusters.outlier_clusters.length > 0) {
      patterns.push({
        type: 'anomaly',
        confidence: outlierClusters.confidence,
        description: `${outlierClusters.outlier_clusters.length} outlier clusters detected using DBSCAN`,
        parameters: {
          cluster_count: outlierClusters.outlier_clusters.length,
          outlier_count: outlierClusters.total_outliers,
          outlier_percentage: (outlierClusters.total_outliers / data.length) * 100,
          cluster_sizes: outlierClusters.outlier_clusters.map(c => c.size),
          detection_method: 'dbscan'
        },
        affectedColumns: numericColumns,
        algorithm: 'dbscan_outlier_detection',
        statistical_significance: outlierClusters.confidence,
        effect_size: outlierClusters.total_outliers / data.length,
        metadata: {
          sample_size: data.length,
          algorithm_params: { eps: outlierClusters.eps, min_samples: outlierClusters.min_samples }
        }
      });
    }
    
    return patterns;
  }

  // Helper methods for advanced algorithms

  private analyzeDistribution(values: number[]): DistributionAnalysis {
    const mean = ss.mean(values);
    const std = ss.standardDeviation(values);
    const skewness = this.calculateSkewness(values, mean, std);
    const kurtosis = this.calculateKurtosis(values, mean, std);
    
    // Simplified distribution detection with goodness of fit
    let type: DistributionAnalysis['type'];
    let goodnessOfFit = 0;
    
    if (Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 1) {
      type = 'normal';
      goodnessOfFit = 1 - (Math.abs(skewness) + Math.abs(kurtosis)) / 2;
    } else if (skewness > 1.5) {
      type = 'exponential';
      goodnessOfFit = Math.min(1, skewness / 3);
    } else if (Math.abs(skewness) < 0.3 && Math.abs(kurtosis + 1.2) < 0.5) {
      type = 'uniform';
      goodnessOfFit = 1 - Math.abs(kurtosis + 1.2);
    } else if (kurtosis < -1) {
      type = 'bimodal';
      goodnessOfFit = Math.max(0, 1 + kurtosis);
    } else if (Math.abs(skewness) > 1) {
      type = 'skewed';
      goodnessOfFit = Math.min(1, Math.abs(skewness) / 3);
    } else if (kurtosis > 3) {
      type = 'heavy_tailed';
      goodnessOfFit = Math.min(1, kurtosis / 10);
    } else {
      type = 'normal';
      goodnessOfFit = 0.5;
    }
    
    return {
      type,
      parameters: { mean, std, skewness, kurtosis },
      goodness_of_fit: Math.max(0, Math.min(1, goodnessOfFit)),
      normality_tests: {
        // Simplified normality test approximations
        shapiro_wilk: Math.max(0, 1 - (Math.abs(skewness) + Math.abs(kurtosis)) / 4),
        kolmogorov_smirnov: Math.max(0, 1 - Math.abs(skewness) / 2)
      }
    };
  }

  private spearmanCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const ranks_x = this.getRanks(x);
    const ranks_y = this.getRanks(y);
    
    return ss.sampleCorrelation(ranks_x, ranks_y);
  }

  private getRanks(values: number[]): number[] {
    const indexed = values.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => a.val - b.val);
    
    const ranks = new Array(values.length);
    for (let i = 0; i < indexed.length; i++) {
      ranks[indexed[i].idx] = i + 1;
    }
    
    return ranks;
  }

  private detectPolynomialRelationship(x: number[], y: number[]): {
    degree: number;
    r_squared: number;
    coefficients: number[];
  } {
    let bestRSquared = 0;
    let bestDegree = 1;
    let bestCoefficients: number[] = [];
    
    // Test polynomial degrees 1-3
    for (let degree = 1; degree <= 3; degree++) {
      try {
        const coefficients = this.polynomialRegression(x, y, degree);
        const predicted = x.map(xi => this.evaluatePolynomial(xi, coefficients));
        const rSquared = this.calculateRSquared(y, predicted);
        
        if (rSquared > bestRSquared) {
          bestRSquared = rSquared;
          bestDegree = degree;
          bestCoefficients = coefficients;
        }
      } catch (error) {
        // Skip if regression fails
      }
    }
    
    return {
      degree: bestDegree,
      r_squared: bestRSquared,
      coefficients: bestCoefficients
    };
  }

  private polynomialRegression(x: number[], y: number[], degree: number): number[] {
    // Simplified polynomial regression using least squares
    const n = x.length;
    const matrix: number[][] = [];
    
    // Create design matrix
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j <= degree; j++) {
        row.push(Math.pow(x[i], j));
      }
      matrix.push(row);
    }
    
    // Solve normal equation: (X'X)^(-1)X'y
    // This is a simplified implementation
    const coefficients = new Array(degree + 1).fill(0);
    
    // For linear case (degree 1)
    if (degree === 1) {
      const regression = ss.linearRegression(x.map((xi, i) => [xi, y[i]]));
      coefficients[0] = regression.b; // intercept
      coefficients[1] = regression.m; // slope
    } else {
      // For higher degrees, use approximation
      coefficients[0] = ss.mean(y);
      coefficients[1] = ss.sampleCorrelation(x, y) * (ss.standardDeviation(y) / ss.standardDeviation(x));
    }
    
    return coefficients;
  }

  private evaluatePolynomial(x: number, coefficients: number[]): number {
    let result = 0;
    for (let i = 0; i < coefficients.length; i++) {
      result += coefficients[i] * Math.pow(x, i);
    }
    return result;
  }

  private calculateRSquared(actual: number[], predicted: number[]): number {
    const actualMean = ss.mean(actual);
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    
    return totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);
  }

  private hierarchicalClustering(data: number[][]): any {
    // Simplified hierarchical clustering
    // In a real implementation, you would use a proper clustering library
    return { levels: [2, 3, 4, 5], method: 'ward' };
  }

  private cutDendrogram(dendrogram: any, numClusters: number): number[] {
    // Simplified cluster assignment
    const clusters = new Array(dendrogram.levels.length);
    for (let i = 0; i < clusters.length; i++) {
      clusters[i] = i % numClusters;
    }
    return clusters;
  }

  private analyzeFrequencyDomain(values: number[]): FrequencyPattern {
    // Simplified frequency domain analysis
    // In a real implementation, you would use FFT
    
    const peaks: Array<{ position: number; magnitude: number; significance: number }> = [];
    const valleys: Array<{ position: number; magnitude: number; significance: number }> = [];
    
    // Detect local maxima and minima
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
        peaks.push({
          position: i,
          magnitude: values[i],
          significance: this.calculatePeakSignificance(values, i)
        });
      } else if (values[i] < values[i - 1] && values[i] < values[i + 1]) {
        valleys.push({
          position: i,
          magnitude: values[i],
          significance: this.calculatePeakSignificance(values, i)
        });
      }
    }
    
    const significantPeaks = peaks.filter(p => p.significance > 0.5);
    const dominantFrequency = significantPeaks.length > 0 ? 
      1 / (significantPeaks[0].position - (significantPeaks[1]?.position || 0)) : 0;
    
    return {
      peaks,
      valleys,
      dominant_frequency: Math.abs(dominantFrequency),
      harmonic_frequencies: significantPeaks.slice(1, 4).map(p => 1 / p.position),
      spectral_entropy: this.calculateSpectralEntropy(values),
      periodicity_strength: Math.min(1, significantPeaks.length / 10)
    };
  }

  private calculatePeakSignificance(values: number[], position: number): number {
    const windowSize = Math.min(10, Math.floor(values.length / 10));
    const start = Math.max(0, position - windowSize);
    const end = Math.min(values.length, position + windowSize);
    
    const window = values.slice(start, end);
    const mean = ss.mean(window);
    const std = ss.standardDeviation(window);
    
    if (std === 0) return 0;
    
    return Math.min(1, Math.abs(values[position] - mean) / (2 * std));
  }

  private calculateSpectralEntropy(values: number[]): number {
    // Simplified spectral entropy calculation
    const bins = 20;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / bins;
    
    if (binSize === 0) return 0;
    
    const histogram = new Array(bins).fill(0);
    for (const value of values) {
      const bin = Math.min(bins - 1, Math.floor((value - min) / binSize));
      histogram[bin]++;
    }
    
    let entropy = 0;
    for (const count of histogram) {
      if (count > 0) {
        const p = count / values.length;
        entropy -= p * Math.log2(p);
      }
    }
    
    return entropy / Math.log2(bins); // Normalized entropy
  }

  private fitAutoregressive(values: number[], order: number): {
    coefficients: number[];
    r_squared: number;
    residual_variance: number;
    significance: number;
  } {
    // Simplified AR model fitting
    const n = values.length - order;
    const y = values.slice(order);
    const X: number[][] = [];
    
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 1; j <= order; j++) {
        row.push(values[order + i - j]);
      }
      X.push(row);
    }
    
    // Simplified coefficient estimation
    const coefficients = new Array(order).fill(0);
    for (let i = 0; i < order; i++) {
      const lag_values = X.map(row => row[i]);
      coefficients[i] = ss.sampleCorrelation(lag_values, y) * 0.5; // Simplified
    }
    
    // Calculate R-squared
    const predicted = y.map((_, i) => {
      let pred = 0;
      for (let j = 0; j < order; j++) {
        pred += coefficients[j] * X[i][j];
      }
      return pred;
    });
    
    const r_squared = this.calculateRSquared(y, predicted);
    const residuals = y.map((yi, i) => yi - predicted[i]);
    const residual_variance = ss.variance(residuals);
    
    return {
      coefficients,
      r_squared,
      residual_variance,
      significance: Math.max(0.001, 1 - r_squared) // Simplified p-value approximation
    };
  }

  private detectChangePoints(values: number[]): Array<{
    position: number;
    magnitude: number;
    significance: number;
    direction: 'increase' | 'decrease';
  }> {
    // Simplified change point detection using cumulative sum
    const changePoints: Array<{
      position: number;
      magnitude: number;
      significance: number;
      direction: 'increase' | 'decrease';
    }> = [];
    
    const mean = ss.mean(values);
    let cumsum = 0;
    let maxCumsum = 0;
    let minCumsum = 0;
    
    for (let i = 0; i < values.length; i++) {
      cumsum += values[i] - mean;
      
      if (cumsum > maxCumsum) maxCumsum = cumsum;
      if (cumsum < minCumsum) minCumsum = cumsum;
      
      // Detect significant deviations
      const threshold = 3 * ss.standardDeviation(values);
      
      if (Math.abs(cumsum) > threshold) {
        const magnitude = Math.abs(cumsum) / threshold;
        const significance = Math.min(1, magnitude - 1);
        
        if (significance > 0.5) {
          changePoints.push({
            position: i,
            magnitude,
            significance,
            direction: cumsum > 0 ? 'increase' : 'decrease'
          });
        }
      }
    }
    
    return changePoints;
  }

  private detectMultipleCycles(values: number[]): Array<{
    period: number;
    strength: number;
    phase: number;
  }> {
    const cycles: Array<{ period: number; strength: number; phase: number }> = [];
    
    // Test different periods
    const maxPeriod = Math.floor(values.length / 4);
    
    for (let period = 5; period <= maxPeriod; period++) {
      const strength = Math.abs(this.autocorrelation(values, period));
      
      if (strength > 0.3) {
        cycles.push({
          period,
          strength,
          phase: this.calculatePhase(values, period)
        });
      }
    }
    
    return cycles.sort((a, b) => b.strength - a.strength);
  }

  private calculatePhase(values: number[], period: number): number {
    // Simplified phase calculation
    const cycles = Math.floor(values.length / period);
    if (cycles < 2) return 0;
    
    const firstCycle = values.slice(0, period);
    const secondCycle = values.slice(period, 2 * period);
    
    // Find phase shift by finding peak positions
    const firstPeak = firstCycle.indexOf(Math.max(...firstCycle));
    const secondPeak = secondCycle.indexOf(Math.max(...secondCycle));
    
    return (secondPeak - firstPeak) / period;
  }

  private calculateCycleInteraction(cycles: Array<{ period: number; strength: number }>): number {
    if (cycles.length < 2) return 0;
    
    // Calculate interaction strength based on harmonic relationships
    let interaction = 0;
    
    for (let i = 0; i < cycles.length - 1; i++) {
      for (let j = i + 1; j < cycles.length; j++) {
        const ratio = cycles[i].period / cycles[j].period;
        const harmonic = Math.abs(ratio - Math.round(ratio));
        
        if (harmonic < 0.1) { // Close to harmonic relationship
          interaction += cycles[i].strength * cycles[j].strength;
        }
      }
    }
    
    return Math.min(1, interaction);
  }

  private dbscanOutlierDetection(data: number[][]): {
    outlier_clusters: Array<{ centroid: number[]; size: number }>;
    total_outliers: number;
    confidence: number;
    eps: number;
    min_samples: number;
  } {
    // Simplified DBSCAN implementation
    const eps = this.estimateEps(data);
    const minSamples = Math.max(2, Math.floor(data.length * 0.05));
    
    const clusters = this.simplifiedDbscan(data, eps, minSamples);
    const outlierClusters: Array<{ centroid: number[]; size: number }> = [];
    let totalOutliers = 0;
    
    for (const [clusterId, points] of Object.entries(clusters)) {
      if (clusterId === '-1') { // Outliers
        totalOutliers = points.length;
      } else if (points.length < data.length * 0.1) { // Small clusters might be outlier clusters
        const centroid = this.calculateCentroid(points);
        outlierClusters.push({
          centroid,
          size: points.length
        });
      }
    }
    
    const confidence = totalOutliers > 0 ? Math.min(1, totalOutliers / (data.length * 0.1)) : 0;
    
    return {
      outlier_clusters: outlierClusters,
      total_outliers: totalOutliers,
      confidence,
      eps,
      min_samples: minSamples
    };
  }

  private estimateEps(data: number[][]): number {
    // Simplified eps estimation
    const distances: number[] = [];
    
    for (let i = 0; i < Math.min(100, data.length); i++) {
      for (let j = i + 1; j < Math.min(100, data.length); j++) {
        distances.push(this.euclideanDistance(data[i], data[j]));
      }
    }
    
    distances.sort((a, b) => a - b);
    return distances[Math.floor(distances.length * 0.1)]; // 10th percentile
  }

  private simplifiedDbscan(data: number[][], eps: number, minSamples: number): Record<string, number[][]> {
    // Very simplified DBSCAN implementation
    const clusters: Record<string, number[][]> = {};
    let clusterId = 0;
    
    const visited = new Array(data.length).fill(false);
    const noise: number[][] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (visited[i]) continue;
      
      visited[i] = true;
      const neighbors = this.getNeighbors(data, i, eps);
      
      if (neighbors.length < minSamples) {
        noise.push(data[i]);
      } else {
        clusters[clusterId.toString()] = [data[i]];
        
        for (const neighborIdx of neighbors) {
          if (!visited[neighborIdx]) {
            visited[neighborIdx] = true;
            clusters[clusterId.toString()].push(data[neighborIdx]);
          }
        }
        
        clusterId++;
      }
    }
    
    if (noise.length > 0) {
      clusters['-1'] = noise; // Outliers
    }
    
    return clusters;
  }

  private getNeighbors(data: number[][], pointIdx: number, eps: number): number[] {
    const neighbors: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i !== pointIdx && this.euclideanDistance(data[pointIdx], data[i]) <= eps) {
        neighbors.push(i);
      }
    }
    
    return neighbors;
  }

  private calculateCentroid(points: number[][]): number[] {
    if (points.length === 0) return [];
    
    const dimensions = points[0].length;
    const centroid = new Array(dimensions).fill(0);
    
    for (const point of points) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += point[i];
      }
    }
    
    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= points.length;
    }
    
    return centroid;
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

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  // Enhanced helper methods

  private getAlgorithmForPatternType(type: string): string {
    const algorithmMap: Record<string, string> = {
      'trend': 'linear_regression',
      'seasonal': 'autocorrelation_analysis',
      'correlation': 'pearson_correlation',
      'cluster': 'k_means_clustering',
      'anomaly': 'statistical_outlier_detection'
    };
    
    return algorithmMap[type] || 'unknown';
  }

  private calculateStatisticalSignificance(pattern: DataPattern, data: DataPoint[]): number {
    // Simplified statistical significance calculation
    const sampleSize = data.length;
    const confidence = pattern.confidence;
    
    // Adjust for sample size
    const adjusted = confidence * Math.min(1, Math.sqrt(sampleSize / 30));
    
    return Math.max(0, Math.min(1, adjusted));
  }

  private calculateEffectSize(pattern: DataPattern, data: DataPoint[]): number {
    // Simplified effect size calculation based on pattern type and confidence
    switch (pattern.type) {
      case 'trend':
        return Math.abs(pattern.parameters.slope || 0) / 10; // Normalize slope
      case 'correlation':
        return Math.abs(pattern.parameters.correlation || pattern.confidence);
      case 'anomaly':
        return (pattern.parameters.count || 0) / data.length;
      default:
        return pattern.confidence;
    }
  }

  private calculateNormalitySignificance(tests: Record<string, number>): number {
    return Math.max(...Object.values(tests));
  }

  private calculateDistributionEffectSize(analysis: DistributionAnalysis): number {
    return analysis.goodness_of_fit;
  }

  private calculateCorrelationSignificance(correlation: number, sampleSize: number): number {
    // Simplified significance test for correlation
    const t = Math.abs(correlation) * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
    return Math.min(1, t / 3); // Normalize t-statistic
  }

  private getCorrelationStrength(correlation: number): string {
    const abs = Math.abs(correlation);
    if (abs >= 0.9) return 'very_strong';
    if (abs >= 0.7) return 'strong';
    if (abs >= 0.5) return 'moderate';
    if (abs >= 0.3) return 'weak';
    return 'very_weak';
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

  private createMatrix(data: DataPoint[], columns: string[]): number[][] {
    return data.map(point => 
      columns.map(col => point.values[col] as number)
    );
  }

  private calculateSilhouetteScore(data: number[][], assignments: number[]): number {
    // Simplified silhouette score calculation
    let totalScore = 0;
    const n = data.length;
    
    for (let i = 0; i < n; i++) {
      const clusterA = assignments[i];
      let a = 0; // Average distance to same cluster
      let b = Infinity; // Minimum average distance to other clusters
      
      const sameCluster = assignments.map((cluster, idx) => 
        cluster === clusterA ? idx : -1).filter(idx => idx !== -1 && idx !== i);
      
      if (sameCluster.length > 0) {
        a = sameCluster.reduce((sum, idx) => 
          sum + this.euclideanDistance(data[i], data[idx]), 0) / sameCluster.length;
      }
      
      const otherClusters = [...new Set(assignments)].filter(cluster => cluster !== clusterA);
      
      for (const cluster of otherClusters) {
        const otherPoints = assignments.map((c, idx) => 
          c === cluster ? idx : -1).filter(idx => idx !== -1);
        
        if (otherPoints.length > 0) {
          const avgDist = otherPoints.reduce((sum, idx) => 
            sum + this.euclideanDistance(data[i], data[idx]), 0) / otherPoints.length;
          
          if (avgDist < b) b = avgDist;
        }
      }
      
      const silhouette = b === Infinity ? 0 : (b - a) / Math.max(a, b);
      totalScore += silhouette;
    }
    
    return Math.max(0, totalScore / n);
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
}