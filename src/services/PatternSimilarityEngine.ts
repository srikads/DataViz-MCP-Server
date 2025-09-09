import { PatternFingerprint, PatternFingerprintGenerator } from './PatternFingerprint.js';
import { DataPoint, DataPattern } from '../types/index.js';

interface SimilarityMatch {
  fingerprint: PatternFingerprint;
  similarity: number;
  matchingFeatures: string[];
  differingFeatures: string[];
  confidence: number;
}

interface PatternCluster {
  id: string;
  centroid: PatternFingerprint;
  members: PatternFingerprint[];
  characteristics: {
    dominant_patterns: string[];
    avg_confidence: number;
    size: number;
    variance: number;
  };
}

export class PatternSimilarityEngine {
  private fingerprintGenerator: PatternFingerprintGenerator;
  private storedFingerprints: Map<string, PatternFingerprint> = new Map();
  
  constructor() {
    this.fingerprintGenerator = new PatternFingerprintGenerator();
  }

  async findSimilarPatterns(
    targetData: DataPoint[],
    targetPatterns: DataPattern[],
    connectionId: string,
    threshold: number = 0.7
  ): Promise<SimilarityMatch[]> {
    // Generate fingerprint for target data
    const targetFingerprint = await this.fingerprintGenerator.generateFingerprint(
      targetData, 
      targetPatterns, 
      connectionId
    );

    // Store the fingerprint
    this.storedFingerprints.set(targetFingerprint.id, targetFingerprint);

    // Find similar patterns
    const candidates = Array.from(this.storedFingerprints.values())
      .filter(fp => fp.id !== targetFingerprint.id);

    const matches: SimilarityMatch[] = [];

    for (const candidate of candidates) {
      const similarity = this.calculateDetailedSimilarity(targetFingerprint, candidate);
      
      if (similarity.overall >= threshold) {
        matches.push({
          fingerprint: candidate,
          similarity: similarity.overall,
          matchingFeatures: similarity.matching,
          differingFeatures: similarity.differing,
          confidence: similarity.confidence
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  async compareDatasetPatterns(
    dataset1: { data: DataPoint[], patterns: DataPattern[], id: string },
    dataset2: { data: DataPoint[], patterns: DataPattern[], id: string }
  ): Promise<{
    overall_similarity: number;
    statistical_similarity: number;
    temporal_similarity: number;
    relational_similarity: number;
    anomaly_similarity: number;
    pattern_overlap: string[];
    unique_to_dataset1: string[];
    unique_to_dataset2: string[];
    recommendations: string[];
  }> {
    const fp1 = await this.fingerprintGenerator.generateFingerprint(
      dataset1.data, dataset1.patterns, dataset1.id
    );
    const fp2 = await this.fingerprintGenerator.generateFingerprint(
      dataset2.data, dataset2.patterns, dataset2.id
    );

    const detailedSimilarity = this.calculateDetailedSimilarity(fp1, fp2);
    
    // Calculate component similarities
    const statistical_similarity = this.calculateStatisticalSimilarity(fp1, fp2);
    const temporal_similarity = this.calculateTemporalSimilarity(fp1, fp2);
    const relational_similarity = this.calculateRelationalSimilarity(fp1, fp2);
    const anomaly_similarity = this.calculateAnomalySimilarity(fp1, fp2);

    // Pattern overlap analysis
    const patterns1 = new Set(fp1.pattern_types);
    const patterns2 = new Set(fp2.pattern_types);
    const pattern_overlap = Array.from(patterns1).filter(p => patterns2.has(p));
    const unique_to_dataset1 = Array.from(patterns1).filter(p => !patterns2.has(p));
    const unique_to_dataset2 = Array.from(patterns2).filter(p => !patterns1.has(p));

    const recommendations = this.generateComparisonRecommendations(
      fp1, fp2, detailedSimilarity.overall, pattern_overlap
    );

    return {
      overall_similarity: detailedSimilarity.overall,
      statistical_similarity,
      temporal_similarity,
      relational_similarity,
      anomaly_similarity,
      pattern_overlap,
      unique_to_dataset1,
      unique_to_dataset2,
      recommendations
    };
  }

  async clusterSimilarPatterns(threshold: number = 0.8): Promise<PatternCluster[]> {
    const fingerprints = Array.from(this.storedFingerprints.values());
    
    if (fingerprints.length < 2) return [];

    const clusters: PatternCluster[] = [];
    const processed = new Set<string>();

    for (const fingerprint of fingerprints) {
      if (processed.has(fingerprint.id)) continue;

      const cluster: PatternCluster = {
        id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        centroid: fingerprint,
        members: [fingerprint],
        characteristics: {
          dominant_patterns: [...fingerprint.pattern_types],
          avg_confidence: this.calculateAvgConfidence(fingerprint),
          size: 1,
          variance: 0
        }
      };

      processed.add(fingerprint.id);

      // Find similar fingerprints
      for (const candidate of fingerprints) {
        if (processed.has(candidate.id)) continue;

        const similarity = this.fingerprintGenerator.calculateSimilarity(fingerprint, candidate);
        if (similarity >= threshold) {
          cluster.members.push(candidate);
          processed.add(candidate.id);
        }
      }

      if (cluster.members.length > 1) {
        cluster.characteristics = this.calculateClusterCharacteristics(cluster.members);
        clusters.push(cluster);
      }
    }

    return clusters.sort((a, b) => b.characteristics.size - a.characteristics.size);
  }

  private calculateDetailedSimilarity(fp1: PatternFingerprint, fp2: PatternFingerprint): {
    overall: number;
    matching: string[];
    differing: string[];
    confidence: number;
  } {
    const matching: string[] = [];
    const differing: string[] = [];
    
    // Statistical similarity
    const statSim = this.calculateStatisticalSimilarity(fp1, fp2);
    if (statSim > 0.7) matching.push('statistical_distribution');
    else differing.push('statistical_distribution');

    // Temporal similarity
    const tempSim = this.calculateTemporalSimilarity(fp1, fp2);
    if (tempSim > 0.7) matching.push('temporal_patterns');
    else differing.push('temporal_patterns');

    // Pattern type overlap
    const patterns1 = new Set(fp1.pattern_types);
    const patterns2 = new Set(fp2.pattern_types);
    const commonPatterns = Array.from(patterns1).filter(p => patterns2.has(p));
    
    if (commonPatterns.length > 0) {
      matching.push('pattern_types');
    } else {
      differing.push('pattern_types');
    }

    // Relational similarity
    const relSim = this.calculateRelationalSimilarity(fp1, fp2);
    if (relSim > 0.7) matching.push('correlations');
    else differing.push('correlations');

    // Anomaly similarity
    const anomSim = this.calculateAnomalySimilarity(fp1, fp2);
    if (anomSim > 0.7) matching.push('anomaly_patterns');
    else differing.push('anomaly_patterns');

    const overall = (statSim + tempSim + relSim + anomSim) / 4;
    const confidence = Math.min(
      this.calculateAvgConfidence(fp1),
      this.calculateAvgConfidence(fp2)
    );

    return { overall, matching, differing, confidence };
  }

  private calculateStatisticalSimilarity(fp1: PatternFingerprint, fp2: PatternFingerprint): number {
    const columns1 = Object.keys(fp1.statistical);
    const columns2 = Object.keys(fp2.statistical);
    
    // Find common columns
    const commonColumns = columns1.filter(col => columns2.includes(col));
    
    if (commonColumns.length === 0) return 0;

    let totalSimilarity = 0;
    
    for (const column of commonColumns) {
      const stats1 = fp1.statistical[column];
      const stats2 = fp2.statistical[column];
      
      // Compare distribution characteristics
      const meanSim = 1 - Math.abs(stats1.mean - stats2.mean) / (Math.abs(stats1.mean) + Math.abs(stats2.mean) + 1);
      const stdSim = 1 - Math.abs(stats1.std - stats2.std) / (stats1.std + stats2.std + 1);
      const skewSim = 1 - Math.abs(stats1.skewness - stats2.skewness) / 6; // Skewness typically ranges -3 to 3
      const kurtSim = 1 - Math.abs(stats1.kurtosis - stats2.kurtosis) / 6; // Similar for kurtosis
      
      const distributionSim = stats1.distribution_type === stats2.distribution_type ? 1 : 0.5;
      
      const columnSimilarity = (meanSim + stdSim + skewSim + kurtSim + distributionSim) / 5;
      totalSimilarity += Math.max(0, columnSimilarity);
    }
    
    return totalSimilarity / commonColumns.length;
  }

  private calculateTemporalSimilarity(fp1: PatternFingerprint, fp2: PatternFingerprint): number {
    const temp1 = fp1.temporal;
    const temp2 = fp2.temporal;
    
    const seasonSim = 1 - Math.abs(temp1.seasonality_strength - temp2.seasonality_strength);
    const trendSim = 1 - Math.abs(temp1.trend_strength - temp2.trend_strength);
    const periodSim = 1 - Math.abs(temp1.periodicity_score - temp2.periodicity_score);
    const stationarySim = 1 - Math.abs(temp1.stationarity_score - temp2.stationarity_score);
    
    // Compare dominant frequencies
    const freqSim = temp1.dominant_frequency > 0 && temp2.dominant_frequency > 0 ?
      1 - Math.abs(temp1.dominant_frequency - temp2.dominant_frequency) / 
      Math.max(temp1.dominant_frequency, temp2.dominant_frequency) : 0.5;
    
    return (seasonSim + trendSim + periodSim + stationarySim + freqSim) / 5;
  }

  private calculateRelationalSimilarity(fp1: PatternFingerprint, fp2: PatternFingerprint): number {
    const rel1 = fp1.relational;
    const rel2 = fp2.relational;
    
    // Compare dependency strength
    const depSim = 1 - Math.abs(rel1.dependency_strength - rel2.dependency_strength);
    
    // Compare correlation matrix hashes (exact match gets 1, no match gets 0)
    const hashSim = rel1.correlation_matrix_hash === rel2.correlation_matrix_hash ? 1 : 0;
    
    // Compare mutual information overlap
    const mi1Keys = new Set(Object.keys(rel1.mutual_information));
    const mi2Keys = new Set(Object.keys(rel2.mutual_information));
    const miOverlap = mi1Keys.size > 0 && mi2Keys.size > 0 ?
      Array.from(mi1Keys).filter(key => mi2Keys.has(key)).length / 
      Math.max(mi1Keys.size, mi2Keys.size) : 0.5;
    
    return (depSim + hashSim + miOverlap) / 3;
  }

  private calculateAnomalySimilarity(fp1: PatternFingerprint, fp2: PatternFingerprint): number {
    const anom1 = fp1.anomaly;
    const anom2 = fp2.anomaly;
    
    // Compare anomaly densities
    const densitySim = 1 - Math.abs(anom1.anomaly_density - anom2.anomaly_density);
    
    // Compare severity distributions
    const avgSev1 = anom1.outlier_severity.length > 0 ? 
      anom1.outlier_severity.reduce((a, b) => a + b) / anom1.outlier_severity.length : 0;
    const avgSev2 = anom2.outlier_severity.length > 0 ?
      anom2.outlier_severity.reduce((a, b) => a + b) / anom2.outlier_severity.length : 0;
    
    const severitySim = avgSev1 > 0 || avgSev2 > 0 ?
      1 - Math.abs(avgSev1 - avgSev2) / Math.max(avgSev1, avgSev2, 1) : 1;
    
    // Compare anomaly signatures
    const signatureSim = anom1.anomaly_signature === anom2.anomaly_signature ? 1 : 0;
    
    return (densitySim + severitySim + signatureSim) / 3;
  }

  private calculateAvgConfidence(fingerprint: PatternFingerprint): number {
    const confidences = Object.values(fingerprint.confidence_scores);
    return confidences.length > 0 ? 
      confidences.reduce((a, b) => a + b) / confidences.length : 0.5;
  }

  private calculateClusterCharacteristics(members: PatternFingerprint[]) {
    const allPatterns = members.flatMap(fp => fp.pattern_types);
    const patternCounts = new Map<string, number>();
    
    for (const pattern of allPatterns) {
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
    }
    
    const dominant_patterns = Array.from(patternCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([pattern]) => pattern);
    
    const avg_confidence = members.reduce((sum, fp) => 
      sum + this.calculateAvgConfidence(fp), 0
    ) / members.length;
    
    // Calculate variance in similarity vectors
    const vectors = members.map(fp => fp.similarity_vector);
    const avgVector = vectors[0].map((_, i) => 
      vectors.reduce((sum, vec) => sum + vec[i], 0) / vectors.length
    );
    
    const variance = vectors.reduce((sum, vec) => {
      const diff = vec.reduce((diffSum, val, i) => 
        diffSum + Math.pow(val - avgVector[i], 2), 0
      );
      return sum + diff;
    }, 0) / (vectors.length * avgVector.length);
    
    return {
      dominant_patterns,
      avg_confidence,
      size: members.length,
      variance
    };
  }

  private generateComparisonRecommendations(
    fp1: PatternFingerprint,
    fp2: PatternFingerprint,
    similarity: number,
    commonPatterns: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (similarity > 0.8) {
      recommendations.push("These datasets show very similar patterns - consider combining them for analysis");
      if (commonPatterns.length > 0) {
        recommendations.push(`Both datasets share ${commonPatterns.join(', ')} patterns`);
      }
    } else if (similarity > 0.5) {
      recommendations.push("Moderate similarity detected - useful for comparative analysis");
      recommendations.push("Consider investigating what causes the differences");
    } else {
      recommendations.push("These datasets have different characteristics");
      recommendations.push("Analyze them separately or investigate the root causes of differences");
    }

    // Temporal recommendations
    const tempDiff = Math.abs(fp1.temporal.trend_strength - fp2.temporal.trend_strength);
    if (tempDiff > 0.3) {
      recommendations.push("Significant difference in trend strength - investigate temporal factors");
    }

    // Anomaly recommendations
    const anomDiff = Math.abs(fp1.anomaly.anomaly_density - fp2.anomaly.anomaly_density);
    if (anomDiff > 0.1) {
      recommendations.push("Different anomaly patterns - review data quality and external factors");
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  // Public methods for managing stored fingerprints
  storeFingerprint(fingerprint: PatternFingerprint): void {
    this.storedFingerprints.set(fingerprint.id, fingerprint);
  }

  getStoredFingerprints(): PatternFingerprint[] {
    return Array.from(this.storedFingerprints.values());
  }

  clearStoredFingerprints(): void {
    this.storedFingerprints.clear();
  }

  exportFingerprints(): Record<string, PatternFingerprint> {
    return Object.fromEntries(this.storedFingerprints);
  }

  importFingerprints(fingerprints: Record<string, PatternFingerprint>): void {
    for (const [id, fingerprint] of Object.entries(fingerprints)) {
      this.storedFingerprints.set(id, fingerprint);
    }
  }
}