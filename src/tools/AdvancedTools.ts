import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AutoDiscoveryPipeline } from '../services/AutoDiscoveryPipeline.js';
import { PatternFingerprintGenerator, PatternFingerprint } from '../services/PatternFingerprint.js';
import { PatternSimilarityEngine } from '../services/PatternSimilarityEngine.js';
import { NaturalLanguageProcessor } from '../services/NaturalLanguageProcessor.js';
import { AdvancedDataSourceManager } from '../services/AdvancedDataSourceManager.js';
import { AdvancedPatternDetector } from '../services/AdvancedPatternDetector.js';
import { AIAnalyzer } from '../services/AIAnalyzer.js';
import { VisualizationEngine } from '../services/VisualizationEngine.js';

export class AdvancedAnalysisTools {
  private autoDiscovery: AutoDiscoveryPipeline;
  private fingerprintGenerator: PatternFingerprintGenerator;
  private similarityEngine: PatternSimilarityEngine;
  private nlProcessor: NaturalLanguageProcessor;
  private advancedDataManager: AdvancedDataSourceManager;
  private advancedPatternDetector: AdvancedPatternDetector;
  private aiAnalyzer: AIAnalyzer;
  private visualizationEngine: VisualizationEngine;

  constructor() {
    this.autoDiscovery = new AutoDiscoveryPipeline();
    this.fingerprintGenerator = new PatternFingerprintGenerator();
    this.similarityEngine = new PatternSimilarityEngine();
    this.nlProcessor = new NaturalLanguageProcessor();
    this.advancedDataManager = new AdvancedDataSourceManager();
    this.advancedPatternDetector = new AdvancedPatternDetector();
    this.aiAnalyzer = new AIAnalyzer();
    this.visualizationEngine = new VisualizationEngine();
  }

  getAdvancedTools(): Tool[] {
    return [
      {
        name: 'discover_data_sources',
        description: 'Automatically discover data sources in a directory with smart detection',
        inputSchema: {
          type: 'object',
          properties: {
            directory: {
              type: 'string',
              description: 'Directory path to scan for data sources'
            },
            recursive: {
              type: 'boolean',
              default: true,
              description: 'Whether to scan subdirectories recursively'
            },
            maxFiles: {
              type: 'number',
              default: 100,
              description: 'Maximum number of files to scan'
            },
            maxFileSize: {
              type: 'number',
              default: 100 * 1024 * 1024,
              description: 'Maximum file size in bytes (default 100MB)'
            },
            autoConnect: {
              type: 'boolean',
              default: false,
              description: 'Automatically connect to best sources found'
            },
            maxConnections: {
              type: 'number',
              default: 5,
              description: 'Maximum number of auto-connections to make'
            }
          },
          required: ['directory']
        }
      },
      {
        name: 'connect_advanced_source',
        description: 'Connect to advanced data sources (SQL, API, streaming, images)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for this connection'
            },
            type: {
              type: 'string',
              enum: ['sql', 'api', 'websocket', 'kafka', 'image'],
              description: 'Type of advanced data source'
            },
            config: {
              type: 'object',
              properties: {
                connectionString: { type: 'string', description: 'SQL connection string' },
                apiUrl: { type: 'string', description: 'API endpoint URL' },
                apiKey: { type: 'string', description: 'API authentication key' },
                headers: { type: 'object', description: 'Additional HTTP headers' },
                query: { type: 'string', description: 'SQL query or API parameters' },
                tableName: { type: 'string', description: 'Database table name' },
                websocketUrl: { type: 'string', description: 'WebSocket connection URL' },
                kafkaBrokers: { type: 'array', items: { type: 'string' }, description: 'Kafka broker addresses' },
                kafkaTopic: { type: 'string', description: 'Kafka topic name' },
                imageUrl: { type: 'string', description: 'Image URL or file path' },
                imageType: { type: 'string', enum: ['chart', 'graph', 'table'], description: 'Type of image content' }
              }
            }
          },
          required: ['id', 'type', 'config']
        }
      },
      {
        name: 'generate_pattern_fingerprint',
        description: 'Create a unique fingerprint for data patterns with statistical, temporal, and relational signatures',
        inputSchema: {
          type: 'object',
          properties: {
            connectionId: {
              type: 'string',
              description: 'ID of the data source connection'
            }
          },
          required: ['connectionId']
        }
      },
      {
        name: 'find_similar_patterns',
        description: 'Find datasets with similar patterns using fingerprint matching',
        inputSchema: {
          type: 'object',
          properties: {
            connectionId: {
              type: 'string',
              description: 'ID of the target data source connection'
            },
            threshold: {
              type: 'number',
              default: 0.7,
              minimum: 0,
              maximum: 1,
              description: 'Similarity threshold (0-1)'
            }
          },
          required: ['connectionId']
        }
      },
      {
        name: 'compare_datasets',
        description: 'Comprehensive comparison of two datasets including pattern similarity analysis',
        inputSchema: {
          type: 'object',
          properties: {
            connectionId1: {
              type: 'string',
              description: 'First dataset connection ID'
            },
            connectionId2: {
              type: 'string',
              description: 'Second dataset connection ID'
            }
          },
          required: ['connectionId1', 'connectionId2']
        }
      },
      {
        name: 'ask_natural_language',
        description: 'Ask questions about your data in plain English and get intelligent answers with visualizations',
        inputSchema: {
          type: 'object',
          properties: {
            connectionId: {
              type: 'string',
              description: 'ID of the data source connection'
            },
            query: {
              type: 'string',
              description: 'Natural language question about the data'
            }
          },
          required: ['connectionId', 'query']
        }
      },
      {
        name: 'detect_advanced_patterns',
        description: 'Run comprehensive advanced pattern detection including distribution analysis, non-linear correlations, and frequency patterns',
        inputSchema: {
          type: 'object',
          properties: {
            connectionId: {
              type: 'string',
              description: 'ID of the data source connection'
            }
          },
          required: ['connectionId']
        }
      },
      {
        name: 'cluster_similar_datasets',
        description: 'Group similar datasets based on their pattern fingerprints',
        inputSchema: {
          type: 'object',
          properties: {
            threshold: {
              type: 'number',
              default: 0.8,
              minimum: 0,
              maximum: 1,
              description: 'Clustering similarity threshold'
            }
          }
        }
      },
      {
        name: 'continuous_discovery',
        description: 'Set up continuous monitoring for new data sources in a directory',
        inputSchema: {
          type: 'object',
          properties: {
            directory: {
              type: 'string',
              description: 'Directory to monitor'
            },
            intervalMs: {
              type: 'number',
              default: 60000,
              description: 'Monitoring interval in milliseconds'
            },
            recursive: {
              type: 'boolean',
              default: true
            },
            maxFiles: {
              type: 'number',
              default: 100
            }
          },
          required: ['directory']
        }
      },
      {
        name: 'get_nl_examples',
        description: 'Get example natural language queries you can ask about your data',
        inputSchema: {
          type: 'object',
          properties: {
            connectionId: {
              type: 'string',
              description: 'ID of data source to get examples for'
            }
          }
        }
      },
      {
        name: 'export_fingerprints',
        description: 'Export pattern fingerprints for external analysis or backup',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['json'],
              default: 'json'
            }
          }
        }
      },
      {
        name: 'import_fingerprints',
        description: 'Import pattern fingerprints from external source',
        inputSchema: {
          type: 'object',
          properties: {
            fingerprintsData: {
              type: 'string',
              description: 'JSON string containing fingerprints data'
            }
          },
          required: ['fingerprintsData']
        }
      },
      {
        name: 'get_streaming_status',
        description: 'Get status of all streaming data connections',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'manage_api_cache',
        description: 'Manage API data cache (clear, stats)',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['clear', 'stats', 'cleanup'],
              description: 'Cache management action'
            }
          },
          required: ['action']
        }
      }
    ];
  }

  async handleAdvancedToolCall(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case 'discover_data_sources':
          return await this.discoverDataSources(args);
        case 'connect_advanced_source':
          return await this.connectAdvancedSource(args);
        case 'generate_pattern_fingerprint':
          return await this.generatePatternFingerprint(args);
        case 'find_similar_patterns':
          return await this.findSimilarPatterns(args);
        case 'compare_datasets':
          return await this.compareDatasets(args);
        case 'ask_natural_language':
          return await this.askNaturalLanguage(args);
        case 'detect_advanced_patterns':
          return await this.detectAdvancedPatterns(args);
        case 'cluster_similar_datasets':
          return await this.clusterSimilarDatasets(args);
        case 'continuous_discovery':
          return await this.continuousDiscovery(args);
        case 'get_nl_examples':
          return await this.getNLExamples(args);
        case 'export_fingerprints':
          return await this.exportFingerprints(args);
        case 'import_fingerprints':
          return await this.importFingerprints(args);
        case 'get_streaming_status':
          return await this.getStreamingStatus(args);
        case 'manage_api_cache':
          return await this.manageAPICache(args);
        default:
          throw new Error(`Unknown advanced tool: ${name}`);
      }
    } catch (error) {
      return {
        error: `Advanced tool execution failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async discoverDataSources(args: any) {
    const { directory, recursive = true, maxFiles = 100, maxFileSize = 100 * 1024 * 1024, autoConnect = false, maxConnections = 5 } = args;

    const discovered = await this.autoDiscovery.discoverDataSources({
      directory,
      recursive,
      filePatterns: ['*.csv', '*.json', '*.xlsx', '*.xls'],
      maxFileSize,
      maxFiles
    });

    let connectionIds: string[] = [];
    if (autoConnect && discovered.length > 0) {
      connectionIds = await this.autoDiscovery.autoConnectBestSources(discovered, maxConnections);
    }

    const stats = await this.autoDiscovery.getDiscoveryStats(discovered);

    return {
      success: true,
      discovered: {
        sources: discovered.map(source => ({
          path: source.path,
          type: source.type,
          size: source.size,
          confidence: source.confidence,
          columns: source.columns,
          rowCount: source.rowCount,
          lastModified: source.lastModified.toISOString()
        })),
        stats,
        autoConnected: connectionIds,
        totalFound: discovered.length
      }
    };
  }

  private async connectAdvancedSource(args: any) {
    const { id, type, config } = args;

    const source = {
      type,
      config
    };

    const connection = await this.advancedDataManager.connectToSource(id, source as any);

    return {
      success: true,
      connection: {
        id: connection.id,
        type: connection.source.type,
        status: connection.status,
        lastUpdated: new Date(connection.lastUpdated).toISOString(),
        config: connection.source.config
      }
    };
  }

  private async generatePatternFingerprint(args: any) {
    const { connectionId } = args;

    const data = await this.advancedDataManager.loadData(connectionId);
    const patterns = await this.advancedPatternDetector.detectAdvancedPatterns(data);

    const fingerprint = await this.fingerprintGenerator.generateFingerprint(data, patterns, connectionId);
    
    // Store the fingerprint in similarity engine
    this.similarityEngine.storeFingerprint(fingerprint);

    return {
      success: true,
      fingerprint: {
        id: fingerprint.id,
        timestamp: new Date(fingerprint.timestamp).toISOString(),
        dataHash: fingerprint.data_hash,
        patternTypes: fingerprint.pattern_types,
        confidenceScores: fingerprint.confidence_scores,
        statisticalSignatures: Object.keys(fingerprint.statistical).length,
        temporalStrength: fingerprint.temporal.trend_strength + fingerprint.temporal.seasonality_strength,
        relationalComplexity: fingerprint.relational.dependency_strength,
        anomalyDensity: fingerprint.anomaly.anomaly_density,
        similarityVector: fingerprint.similarity_vector.slice(0, 10) // Show first 10 dimensions
      }
    };
  }

  private async findSimilarPatterns(args: any) {
    const { connectionId, threshold = 0.7 } = args;

    const data = await this.advancedDataManager.loadData(connectionId);
    const patterns = await this.advancedPatternDetector.detectAdvancedPatterns(data);

    const matches = await this.similarityEngine.findSimilarPatterns(data, patterns, connectionId, threshold);

    return {
      success: true,
      matches: matches.map(match => ({
        fingerprintId: match.fingerprint.id,
        similarity: match.similarity,
        confidence: match.confidence,
        matchingFeatures: match.matchingFeatures,
        differingFeatures: match.differingFeatures,
        patternTypes: match.fingerprint.pattern_types,
        timestamp: new Date(match.fingerprint.timestamp).toISOString()
      })),
      totalMatches: matches.length,
      threshold
    };
  }

  private async compareDatasets(args: any) {
    const { connectionId1, connectionId2 } = args;

    const data1 = await this.advancedDataManager.loadData(connectionId1);
    const patterns1 = await this.advancedPatternDetector.detectAdvancedPatterns(data1);

    const data2 = await this.advancedDataManager.loadData(connectionId2);
    const patterns2 = await this.advancedPatternDetector.detectAdvancedPatterns(data2);

    const comparison = await this.similarityEngine.compareDatasetPatterns(
      { data: data1, patterns: patterns1, id: connectionId1 },
      { data: data2, patterns: patterns2, id: connectionId2 }
    );

    return {
      success: true,
      comparison: {
        overallSimilarity: comparison.overall_similarity,
        componentSimilarities: {
          statistical: comparison.statistical_similarity,
          temporal: comparison.temporal_similarity,
          relational: comparison.relational_similarity,
          anomaly: comparison.anomaly_similarity
        },
        patternOverlap: comparison.pattern_overlap,
        uniqueToDataset1: comparison.unique_to_dataset1,
        uniqueToDataset2: comparison.unique_to_dataset2,
        recommendations: comparison.recommendations
      }
    };
  }

  private async askNaturalLanguage(args: any) {
    const { connectionId, query } = args;

    const data = await this.advancedDataManager.loadData(connectionId);
    const availableColumns = data.length > 0 ? Object.keys(data[0].values) : [];

    const result = await this.nlProcessor.processQuery(query, data, availableColumns);

    // Generate visualizations if requested
    const generatedVisualizations = [];
    for (const vizConfig of result.visualizations || []) {
      try {
        const viz = await this.visualizationEngine.generateVisualization(vizConfig);
        generatedVisualizations.push({
          config: vizConfig,
          svg: viz.svg,
          metadata: viz.metadata
        });
      } catch (error) {
        // Skip visualizations that fail to generate
      }
    }

    return {
      success: true,
      naturalLanguageResult: {
        query: result.query,
        intent: {
          type: result.intent.type,
          confidence: result.intent.confidence,
          parameters: result.intent.parameters,
          detectedColumns: result.intent.columns,
          filters: result.intent.filters
        },
        answer: result.answer,
        dataInsights: result.data_insights,
        visualizations: generatedVisualizations,
        suggestedFollowups: result.suggested_followup_questions,
        confidence: result.confidence
      }
    };
  }

  private async detectAdvancedPatterns(args: any) {
    const { connectionId } = args;

    const data = await this.advancedDataManager.loadData(connectionId);
    const advancedPatterns = await this.advancedPatternDetector.detectAdvancedPatterns(data);

    const patternsByType = advancedPatterns.reduce((acc, pattern) => {
      if (!acc[pattern.type]) acc[pattern.type] = [];
      acc[pattern.type].push(pattern);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      success: true,
      advancedPatterns: {
        totalPatterns: advancedPatterns.length,
        byType: Object.entries(patternsByType).map(([type, patterns]) => ({
          type,
          count: patterns.length,
          avgConfidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length,
          patterns: patterns.slice(0, 3).map(p => ({ // Top 3 per type
            description: p.description,
            confidence: p.confidence,
            algorithm: p.algorithm,
            statisticalSignificance: p.statistical_significance,
            effectSize: p.effect_size,
            affectedColumns: p.affectedColumns,
            parameters: p.parameters,
            metadata: p.metadata
          }))
        })),
        topPatterns: advancedPatterns.slice(0, 10).map(p => ({
          type: p.type,
          description: p.description,
          confidence: p.confidence,
          algorithm: p.algorithm,
          statisticalSignificance: p.statistical_significance,
          effectSize: p.effect_size,
          sampleSize: p.metadata.sample_size
        }))
      }
    };
  }

  private async clusterSimilarDatasets(args: any) {
    const { threshold = 0.8 } = args;

    const clusters = await this.similarityEngine.clusterSimilarPatterns(threshold);

    return {
      success: true,
      clusters: clusters.map(cluster => ({
        id: cluster.id,
        size: cluster.characteristics.size,
        dominantPatterns: cluster.characteristics.dominant_patterns,
        avgConfidence: cluster.characteristics.avg_confidence,
        variance: cluster.characteristics.variance,
        members: cluster.members.slice(0, 5).map(member => ({ // Show first 5 members
          id: member.id,
          timestamp: new Date(member.timestamp).toISOString(),
          patternTypes: member.pattern_types
        }))
      })),
      totalClusters: clusters.length,
      threshold
    };
  }

  private async continuousDiscovery(args: any) {
    const { directory, intervalMs = 60000, recursive = true, maxFiles = 100 } = args;

    const monitor = await this.autoDiscovery.continuousDiscovery(
      {
        directory,
        recursive,
        filePatterns: ['*.csv', '*.json', '*.xlsx', '*.xls'],
        maxFileSize: 100 * 1024 * 1024,
        maxFiles
      },
      intervalMs,
      (newSources) => {
        // In a real implementation, you would emit events or notifications
        console.log(`Discovered ${newSources.length} new/updated sources`);
      }
    );

    return {
      success: true,
      monitoring: {
        directory,
        intervalMs,
        recursive,
        maxFiles,
        status: 'active',
        message: 'Continuous discovery started. Use the returned stop function to halt monitoring.'
      }
    };
  }

  private async getNLExamples(args: any) {
    const { connectionId } = args;

    let availableColumns: string[] = [];
    if (connectionId) {
      try {
        const data = await this.advancedDataManager.loadData(connectionId);
        availableColumns = data.length > 0 ? Object.keys(data[0].values) : [];
      } catch (error) {
        // Use generic examples if data can't be loaded
      }
    }

    const examples = this.nlProcessor.getExampleQueries(availableColumns);

    return {
      success: true,
      examples: examples.map((query, index) => ({
        id: index + 1,
        query,
        category: this.categorizeQuery(query)
      })),
      availableColumns,
      totalExamples: examples.length
    };
  }

  private async exportFingerprints(args: any) {
    const { format = 'json' } = args;

    const fingerprints = this.similarityEngine.exportFingerprints();

    return {
      success: true,
      export: {
        format,
        data: JSON.stringify(fingerprints, null, 2),
        count: Object.keys(fingerprints).length,
        exportedAt: new Date().toISOString()
      }
    };
  }

  private async importFingerprints(args: any) {
    const { fingerprintsData } = args;

    try {
      const fingerprints = JSON.parse(fingerprintsData);
      this.similarityEngine.importFingerprints(fingerprints);

      return {
        success: true,
        imported: {
          count: Object.keys(fingerprints).length,
          importedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Failed to import fingerprints: ${error}`);
    }
  }

  private async getStreamingStatus(args: any) {
    const connections = this.advancedDataManager.getStreamingConnections();

    return {
      success: true,
      streaming: {
        totalConnections: connections.length,
        activeConnections: connections.filter(conn => conn.isActive).length,
        connections: connections.map(conn => ({
          id: conn.id,
          type: conn.type,
          isActive: conn.isActive
        }))
      }
    };
  }

  private async manageAPICache(args: any) {
    const { action } = args;

    switch (action) {
      case 'clear':
        this.advancedDataManager.clearAPICache();
        return {
          success: true,
          action: 'clear',
          message: 'API cache cleared successfully'
        };

      case 'stats':
        const stats = this.advancedDataManager.getAPICacheStats();
        return {
          success: true,
          action: 'stats',
          cache: {
            entries: stats.entries,
            totalSize: stats.totalSize,
            oldestEntry: new Date(stats.oldestEntry).toISOString()
          }
        };

      case 'cleanup':
        this.advancedDataManager.cleanupExpiredCache();
        const newStats = this.advancedDataManager.getAPICacheStats();
        return {
          success: true,
          action: 'cleanup',
          message: 'Expired cache entries cleaned up',
          remainingEntries: newStats.entries
        };

      default:
        throw new Error(`Unknown cache action: ${action}`);
    }
  }

  private categorizeQuery(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('trend') || lowerQuery.includes('seasonal')) {
      return 'pattern_analysis';
    } else if (lowerQuery.includes('show') || lowerQuery.includes('plot') || lowerQuery.includes('chart')) {
      return 'visualization';
    } else if (lowerQuery.includes('correlation') || lowerQuery.includes('relationship')) {
      return 'correlation_analysis';
    } else if (lowerQuery.includes('anomal') || lowerQuery.includes('outlier')) {
      return 'anomaly_detection';
    } else if (lowerQuery.includes('compare') || lowerQuery.includes('difference')) {
      return 'comparison';
    } else if (lowerQuery.includes('average') || lowerQuery.includes('summary') || lowerQuery.includes('statistics')) {
      return 'statistical_summary';
    }
    
    return 'general';
  }
}