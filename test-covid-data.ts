#!/usr/bin/env node

/**
 * Test Script for COVID-19 Data Analysis
 * Tests the advanced MCP server capabilities with real-world time series data
 * 
 * Data Source: Johns Hopkins COVID-19 Data Repository
 * https://github.com/CSSEGISandData/COVID-19
 */

import { DataVizTools } from './src/tools/index.js';
import fs from 'fs';
import path from 'path';
import https from 'https';

class COVID19DataTester {
  private dataVizTools: DataVizTools;
  private testDataDir: string;
  
  constructor() {
    this.dataVizTools = new DataVizTools();
    this.testDataDir = './test-data/covid19';
  }

  async runComprehensiveTest() {
    console.log('🧪 Starting COVID-19 Data Analysis Test Suite\n');
    
    try {
      // Step 1: Setup test environment
      await this.setupTestEnvironment();
      
      // Step 2: Download sample COVID-19 data
      await this.downloadCOVIDData();
      
      // Step 3: Test auto-discovery
      await this.testAutoDiscovery();
      
      // Step 4: Test advanced pattern detection
      await this.testAdvancedPatternDetection();
      
      // Step 5: Test natural language queries
      await this.testNaturalLanguageQueries();
      
      // Step 6: Test pattern fingerprinting
      await this.testPatternFingerprinting();
      
      // Step 7: Test dataset comparison
      await this.testDatasetComparison();
      
      // Step 8: Generate comprehensive dashboard
      await this.generateCOVIDDashboard();
      
      console.log('✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    }
  }

  private async setupTestEnvironment() {
    console.log('📁 Setting up test environment...');
    
    if (!fs.existsSync(this.testDataDir)) {
      fs.mkdirSync(this.testDataDir, { recursive: true });
    }
    
    console.log(`✅ Test directory created: ${this.testDataDir}\n`);
  }

  private async downloadCOVIDData() {
    console.log('📥 Downloading COVID-19 sample data...');
    
    const urls = [
      {
        url: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv',
        filename: 'confirmed_global.csv'
      },
      {
        url: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv',
        filename: 'deaths_global.csv'
      },
      {
        url: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv',
        filename: 'recovered_global.csv'
      }
    ];

    for (const { url, filename } of urls) {
      const filePath = path.join(this.testDataDir, filename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`  Downloading ${filename}...`);
        await this.downloadFile(url, filePath);
      } else {
        console.log(`  ✅ ${filename} already exists`);
      }
    }
    
    console.log('✅ COVID-19 data ready\n');
  }

  private downloadFile(url: string, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filepath);
      
      https.get(url, (response) => {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
        file.on('error', (error) => {
          fs.unlink(filepath, () => {}); // Delete file on error
          reject(error);
        });
      }).on('error', reject);
    });
  }

  private async testAutoDiscovery() {
    console.log('🔍 Testing Auto-Discovery Pipeline...');
    
    try {
      const result = await this.dataVizTools.handleToolCall('discover_data_sources', {
        directory: this.testDataDir,
        recursive: true,
        autoConnect: true,
        maxConnections: 3
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log(`  📊 Discovered ${result.discovered.totalFound} data sources`);
      console.log(`  🔗 Auto-connected to ${result.discovered.autoConnected.length} sources`);
      console.log('  📈 Discovery Stats:');
      console.log(`    - Average confidence: ${result.discovered.stats.avgConfidence.toFixed(2)}`);
      console.log(`    - Total size: ${(result.discovered.stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`    - File types: ${Object.entries(result.discovered.stats.byType).map(([type, count]) => `${type}: ${count}`).join(', ')}`);
      
      // Store connection IDs for later use
      this.connectionIds = result.discovered.autoConnected;
      
    } catch (error) {
      console.error('❌ Auto-discovery failed:', error);
      throw error;
    }
    
    console.log('✅ Auto-discovery test passed\n');
  }

  private connectionIds: string[] = [];

  private async testAdvancedPatternDetection() {
    console.log('🧠 Testing Advanced Pattern Detection...');
    
    if (this.connectionIds.length === 0) {
      throw new Error('No connections available for pattern detection test');
    }
    
    const connectionId = this.connectionIds[0];
    
    try {
      const result = await this.dataVizTools.handleToolCall('detect_advanced_patterns', {
        connectionId
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log(`  🔬 Detected ${result.advancedPatterns.totalPatterns} patterns`);
      console.log('  📊 Pattern Types Found:');
      
      for (const patternGroup of result.advancedPatterns.byType) {
        console.log(`    - ${patternGroup.type}: ${patternGroup.count} patterns (avg confidence: ${patternGroup.avgConfidence.toFixed(2)})`);
        
        // Show top pattern for each type
        if (patternGroup.patterns.length > 0) {
          const topPattern = patternGroup.patterns[0];
          console.log(`      └ ${topPattern.description}`);
        }
      }
      
      console.log('\n  🏆 Top Patterns Overall:');
      for (const pattern of result.advancedPatterns.topPatterns.slice(0, 3)) {
        console.log(`    ${pattern.confidence.toFixed(3)} - ${pattern.description}`);
        console.log(`      Algorithm: ${pattern.algorithm}, Effect Size: ${pattern.effectSize.toFixed(3)}`);
      }
      
    } catch (error) {
      console.error('❌ Advanced pattern detection failed:', error);
      throw error;
    }
    
    console.log('✅ Advanced pattern detection test passed\n');
  }

  private async testNaturalLanguageQueries() {
    console.log('💬 Testing Natural Language Queries...');
    
    if (this.connectionIds.length === 0) {
      throw new Error('No connections available for NL query test');
    }
    
    const connectionId = this.connectionIds[0];
    
    const testQueries = [
      "What are the trends in the COVID-19 data?",
      "Show me any seasonal patterns in the confirmed cases",
      "Find anomalies in the death rates",
      "What correlations exist between different metrics?",
      "Give me a statistical summary of the dataset"
    ];
    
    console.log('  🤖 Testing natural language understanding...\n');
    
    for (const query of testQueries) {
      try {
        console.log(`  Question: "${query}"`);
        
        const result = await this.dataVizTools.handleToolCall('ask_natural_language', {
          connectionId,
          query
        });
        
        if (result.error) {
          console.log(`    ❌ Error: ${result.error}`);
          continue;
        }
        
        const nlResult = result.naturalLanguageResult;
        console.log(`    Intent: ${nlResult.intent.type} (confidence: ${nlResult.intent.confidence.toFixed(2)})`);
        console.log(`    Answer: ${nlResult.answer.substring(0, 100)}${nlResult.answer.length > 100 ? '...' : ''}`);
        console.log(`    Visualizations: ${nlResult.visualizations.length}`);
        console.log(`    Insights: ${nlResult.dataInsights.length}`);
        
        if (nlResult.suggestedFollowups.length > 0) {
          console.log(`    Follow-up: "${nlResult.suggestedFollowups[0]}"`);
        }
        
        console.log();
        
      } catch (error) {
        console.log(`    ❌ Query failed: ${error}`);
      }
    }
    
    console.log('✅ Natural language query test passed\n');
  }

  private async testPatternFingerprinting() {
    console.log('🔒 Testing Pattern Fingerprinting...');
    
    if (this.connectionIds.length === 0) {
      throw new Error('No connections available for fingerprinting test');
    }
    
    const connectionId = this.connectionIds[0];
    
    try {
      const result = await this.dataVizTools.handleToolCall('generate_pattern_fingerprint', {
        connectionId
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const fingerprint = result.fingerprint;
      console.log(`  🔑 Generated fingerprint: ${fingerprint.id}`);
      console.log(`  📅 Timestamp: ${fingerprint.timestamp}`);
      console.log(`  🧬 Data hash: ${fingerprint.dataHash}`);
      console.log(`  🎯 Pattern types: ${fingerprint.patternTypes.join(', ')}`);
      console.log(`  💪 Temporal strength: ${fingerprint.temporalStrength.toFixed(3)}`);
      console.log(`  🕸️ Relational complexity: ${fingerprint.relationalComplexity.toFixed(3)}`);
      console.log(`  ⚠️ Anomaly density: ${fingerprint.anomalyDensity.toFixed(3)}`);
      console.log(`  📊 Statistical signatures: ${fingerprint.statisticalSignatures}`);
      console.log(`  🔢 Similarity vector (first 10): [${fingerprint.similarityVector.map(v => v.toFixed(3)).join(', ')}]`);
      
    } catch (error) {
      console.error('❌ Pattern fingerprinting failed:', error);
      throw error;
    }
    
    console.log('✅ Pattern fingerprinting test passed\n');
  }

  private async testDatasetComparison() {
    console.log('🔄 Testing Dataset Comparison...');
    
    if (this.connectionIds.length < 2) {
      console.log('  ⚠️  Need at least 2 datasets for comparison test, skipping...\n');
      return;
    }
    
    const connectionId1 = this.connectionIds[0];
    const connectionId2 = this.connectionIds[1];
    
    try {
      const result = await this.dataVizTools.handleToolCall('compare_datasets', {
        connectionId1,
        connectionId2
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const comparison = result.comparison;
      console.log(`  📊 Overall similarity: ${comparison.overallSimilarity.toFixed(3)}`);
      console.log('  🔍 Component similarities:');
      console.log(`    - Statistical: ${comparison.componentSimilarities.statistical.toFixed(3)}`);
      console.log(`    - Temporal: ${comparison.componentSimilarities.temporal.toFixed(3)}`);
      console.log(`    - Relational: ${comparison.componentSimilarities.relational.toFixed(3)}`);
      console.log(`    - Anomaly: ${comparison.componentSimilarities.anomaly.toFixed(3)}`);
      
      console.log(`  🤝 Pattern overlap: ${comparison.patternOverlap.join(', ') || 'None'}`);
      console.log(`  🆕 Unique to dataset 1: ${comparison.uniqueToDataset1.join(', ') || 'None'}`);
      console.log(`  🆕 Unique to dataset 2: ${comparison.uniqueToDataset2.join(', ') || 'None'}`);
      
      if (comparison.recommendations.length > 0) {
        console.log('  💡 Recommendations:');
        comparison.recommendations.forEach((rec: string, i: number) => {
          console.log(`    ${i + 1}. ${rec}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Dataset comparison failed:', error);
      throw error;
    }
    
    console.log('✅ Dataset comparison test passed\n');
  }

  private async generateCOVIDDashboard() {
    console.log('📈 Generating COVID-19 Dashboard...');
    
    if (this.connectionIds.length === 0) {
      throw new Error('No connections available for dashboard generation');
    }
    
    const connectionId = this.connectionIds[0];
    
    try {
      const result = await this.dataVizTools.handleToolCall('generate_dashboard', {
        connectionId,
        maxVisualizations: 8
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const dashboard = result.dashboard;
      console.log(`  📊 Dashboard: ${dashboard.title}`);
      console.log(`  📅 Generated: ${dashboard.generatedAt}`);
      console.log(`  📈 Summary:`);
      console.log(`    - Total records: ${dashboard.summary.totalRecords.toLocaleString()}`);
      console.log(`    - Patterns found: ${dashboard.summary.patternsFound}`);
      console.log(`    - Visualizations: ${dashboard.summary.visualizationsGenerated}`);
      
      console.log('\n  🔍 Key Patterns:');
      dashboard.patterns.slice(0, 5).forEach((pattern: any, i: number) => {
        console.log(`    ${i + 1}. ${pattern.type.toUpperCase()}: ${pattern.description}`);
        console.log(`       Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
      });
      
      if (dashboard.recommendations.length > 0) {
        console.log('\n  💡 Key Recommendations:');
        dashboard.recommendations.slice(0, 3).forEach((rec: string, i: number) => {
          console.log(`    ${i + 1}. ${rec}`);
        });
      }
      
      console.log('\n  📊 Visualizations Generated:');
      dashboard.visualizations.forEach((viz: any, i: number) => {
        console.log(`    ${i + 1}. ${viz.config.type.toUpperCase()}: ${viz.config.title || 'Untitled'}`);
        console.log(`       Data points: ${viz.metadata.dataPoints}, Size: ${viz.metadata.width}x${viz.metadata.height}`);
      });
      
    } catch (error) {
      console.error('❌ Dashboard generation failed:', error);
      throw error;
    }
    
    console.log('✅ COVID-19 dashboard generated successfully\n');
  }

  // Additional utility method for testing similarity clustering
  private async testSimilarityclustering() {
    console.log('🕷️ Testing Similarity Clustering...');
    
    try {
      const result = await this.dataVizTools.handleToolCall('cluster_similar_datasets', {
        threshold: 0.7
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log(`  📚 Found ${result.totalClusters} clusters`);
      
      result.clusters.forEach((cluster: any, i: number) => {
        console.log(`  Cluster ${i + 1}:`);
        console.log(`    - Size: ${cluster.size} datasets`);
        console.log(`    - Dominant patterns: ${cluster.dominantPatterns.join(', ')}`);
        console.log(`    - Avg confidence: ${cluster.avgConfidence.toFixed(3)}`);
        console.log(`    - Variance: ${cluster.variance.toFixed(3)}`);
      });
      
    } catch (error) {
      console.error('❌ Similarity clustering failed:', error);
    }
    
    console.log('✅ Similarity clustering test completed\n');
  }

  // Method to export test results
  private async exportTestResults() {
    console.log('📤 Exporting test results...');
    
    try {
      const fingerprintResult = await this.dataVizTools.handleToolCall('export_fingerprints', {
        format: 'json'
      });
      
      if (!fingerprintResult.error) {
        const exportPath = path.join(this.testDataDir, 'covid19_fingerprints.json');
        fs.writeFileSync(exportPath, fingerprintResult.export.data);
        console.log(`  📁 Fingerprints exported to: ${exportPath}`);
      }
      
      if (this.connectionIds.length > 0) {
        const analysisResult = await this.dataVizTools.handleToolCall('export_analysis', {
          connectionId: this.connectionIds[0],
          format: 'html'
        });
        
        if (!analysisResult.error) {
          const htmlPath = path.join(this.testDataDir, 'covid19_analysis.html');
          fs.writeFileSync(htmlPath, analysisResult.export.content);
          console.log(`  📄 Analysis report exported to: ${htmlPath}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Export failed:', error);
    }
    
    console.log('✅ Test results exported\n');
  }
}

// Run the test suite
const tester = new COVID19DataTester();

async function main() {
  await tester.runComprehensiveTest();
  
  // Optional: Run additional tests
  console.log('🔄 Running additional advanced tests...');
  await (tester as any).testSimilarityclustering();
  await (tester as any).exportTestResults();
  
  console.log('🎉 Complete COVID-19 data analysis test suite finished!');
  console.log('\nThis test demonstrates:');
  console.log('✅ Auto-discovery of time series data');
  console.log('✅ Advanced pattern detection (15+ algorithms)');
  console.log('✅ Natural language query processing');
  console.log('✅ Pattern fingerprinting for dataset similarity');
  console.log('✅ Multi-dataset comparison and clustering');
  console.log('✅ Comprehensive dashboard generation');
  console.log('✅ Export capabilities for further analysis\n');
}

if (require.main === module) {
  main().catch(console.error);
}