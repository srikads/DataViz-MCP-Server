import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { DataSourceManager } from '../services/DataSourceManager.js';
import { AIAnalyzer } from '../services/AIAnalyzer.js';
import { VisualizationEngine } from '../services/VisualizationEngine.js';
import { AdvancedAnalysisTools } from './AdvancedTools.js';
import { DataSource, VisualizationConfig } from '../types/index.js';

export class DataVizTools {
  private dataSourceManager: DataSourceManager;
  private aiAnalyzer: AIAnalyzer;
  private visualizationEngine: VisualizationEngine;
  private advancedTools: AdvancedAnalysisTools;

  constructor() {
    this.dataSourceManager = new DataSourceManager();
    this.aiAnalyzer = new AIAnalyzer();
    this.visualizationEngine = new VisualizationEngine();
    this.advancedTools = new AdvancedAnalysisTools();
  }

  getTools(): Tool[] {
    const basicTools = [
      {
        name: 'connect_data_source',
        description: 'Connect to a data source (CSV, JSON, Excel)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for this data source connection'
            },
            type: {
              type: 'string',
              enum: ['csv', 'json', 'excel'],
              description: 'Type of data source'
            },
            filePath: {
              type: 'string',
              description: 'Path to the data file'
            },
            sheetName: {
              type: 'string',
              description: 'Sheet name for Excel files (optional)'
            }
          },
          required: ['id', 'type', 'filePath']
        }
      },
      {
        name: 'load_data',
        description: 'Load data from a connected data source',
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
        name: 'analyze_patterns',
        description: 'Analyze data patterns and generate insights',
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
        name: 'generate_visualization',
        description: 'Generate a specific visualization from the data',
        inputSchema: {
          type: 'object',
          properties: {
            connectionId: {
              type: 'string',
              description: 'ID of the data source connection'
            },
            type: {
              type: 'string',
              enum: ['line', 'bar', 'scatter', 'histogram', 'box', 'heatmap', 'pie'],
              description: 'Type of visualization'
            },
            xAxis: {
              type: 'string',
              description: 'Column name for X-axis'
            },
            yAxis: {
              type: 'string',
              description: 'Column name for Y-axis'
            },
            colorBy: {
              type: 'string',
              description: 'Column name to color by (optional)'
            },
            groupBy: {
              type: 'string',
              description: 'Column name to group by (optional)'
            },
            title: {
              type: 'string',
              description: 'Chart title (optional)'
            },
            width: {
              type: 'number',
              description: 'Chart width in pixels (default: 800)'
            },
            height: {
              type: 'number',
              description: 'Chart height in pixels (default: 600)'
            }
          },
          required: ['connectionId', 'type']
        }
      },
      {
        name: 'get_data_summary',
        description: 'Get a summary of the loaded data including column information and basic statistics',
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
        name: 'list_connections',
        description: 'List all active data source connections',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'generate_dashboard',
        description: 'Generate a complete dashboard with multiple visualizations based on detected patterns',
        inputSchema: {
          type: 'object',
          properties: {
            connectionId: {
              type: 'string',
              description: 'ID of the data source connection'
            },
            maxVisualizations: {
              type: 'number',
              description: 'Maximum number of visualizations to generate (default: 6)'
            }
          },
          required: ['connectionId']
        }
      },
      {
        name: 'export_analysis',
        description: 'Export analysis results and visualizations as a structured report',
        inputSchema: {
          type: 'object',
          properties: {
            connectionId: {
              type: 'string',
              description: 'ID of the data source connection'
            },
            format: {
              type: 'string',
              enum: ['json', 'html'],
              description: 'Export format'
            }
          },
          required: ['connectionId', 'format']
        }
      }
    ];

    // Combine basic tools with advanced tools
    const advancedTools = this.advancedTools.getAdvancedTools();
    return [...basicTools, ...advancedTools];
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case 'connect_data_source':
          return await this.connectDataSource(args);
        case 'load_data':
          return await this.loadData(args);
        case 'analyze_patterns':
          return await this.analyzePatterns(args);
        case 'generate_visualization':
          return await this.generateVisualization(args);
        case 'get_data_summary':
          return await this.getDataSummary(args);
        case 'list_connections':
          return await this.listConnections(args);
        case 'generate_dashboard':
          return await this.generateDashboard(args);
        case 'export_analysis':
          return await this.exportAnalysis(args);
        default:
          // Try advanced tools
          return await this.advancedTools.handleAdvancedToolCall(name, args);
      }
    } catch (error) {
      return {
        error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async connectDataSource(args: any) {
    const { id, type, filePath, sheetName } = args;
    
    const source: DataSource = {
      type,
      config: { filePath, ...(sheetName && { sheetName }) }
    };

    const connection = await this.dataSourceManager.connectToSource(id, source);
    
    return {
      success: true,
      connection: {
        id: connection.id,
        type: connection.source.type,
        status: connection.status,
        lastUpdated: new Date(connection.lastUpdated).toISOString()
      }
    };
  }

  private async loadData(args: any) {
    const { connectionId } = args;
    
    const data = await this.dataSourceManager.loadData(connectionId);
    
    return {
      success: true,
      dataPoints: data.length,
      sampleData: data.slice(0, 5).map(point => ({
        id: point.id,
        values: point.values,
        metadata: point.metadata
      })),
      columns: data.length > 0 ? Object.keys(data[0].values) : []
    };
  }

  private async analyzePatterns(args: any) {
    const { connectionId } = args;
    
    const data = await this.dataSourceManager.loadData(connectionId);
    const analysis = await this.aiAnalyzer.analyzeData(data);
    const insights = await this.aiAnalyzer.generateInsights(data, analysis.patterns);
    
    return {
      success: true,
      analysis: {
        patterns: analysis.patterns.map(pattern => ({
          type: pattern.type,
          confidence: pattern.confidence,
          description: pattern.description,
          parameters: pattern.parameters,
          affectedColumns: pattern.affectedColumns
        })),
        statistics: analysis.statistics,
        recommendations: analysis.recommendations,
        insights: insights,
        suggestedVisualizations: analysis.visualizations.map(viz => ({
          type: viz.type,
          xAxis: viz.xAxis,
          yAxis: viz.yAxis,
          title: viz.title
        }))
      }
    };
  }

  private async generateVisualization(args: any) {
    const { connectionId, type, xAxis, yAxis, colorBy, groupBy, title, width, height } = args;
    
    const data = await this.dataSourceManager.loadData(connectionId);
    
    const config: VisualizationConfig = {
      type,
      data,
      xAxis,
      yAxis,
      colorBy,
      groupBy,
      title,
      width,
      height
    };
    
    const visualization = await this.visualizationEngine.generateVisualization(config);
    
    return {
      success: true,
      visualization: {
        svg: visualization.svg,
        metadata: visualization.metadata,
        config: {
          type,
          xAxis,
          yAxis,
          colorBy,
          groupBy,
          title
        }
      }
    };
  }

  private async getDataSummary(args: any) {
    const { connectionId } = args;
    
    const data = await this.dataSourceManager.loadData(connectionId);
    const connection = this.dataSourceManager.getConnection(connectionId);
    
    if (data.length === 0) {
      return {
        success: true,
        summary: {
          totalRecords: 0,
          columns: [],
          dataTypes: {},
          missingValues: {},
          source: connection?.source
        }
      };
    }

    const columns = Object.keys(data[0].values);
    const dataTypes: Record<string, string> = {};
    const missingValues: Record<string, number> = {};
    const numericStats: Record<string, any> = {};

    for (const column of columns) {
      const values = data.map(point => point.values[column]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      
      missingValues[column] = data.length - nonNullValues.length;
      
      if (nonNullValues.every(v => typeof v === 'number')) {
        dataTypes[column] = 'numeric';
        const numericValues = nonNullValues as number[];
        numericStats[column] = {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          mean: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length,
          count: numericValues.length
        };
      } else {
        dataTypes[column] = 'categorical';
        const uniqueValues = new Set(nonNullValues);
        numericStats[column] = {
          uniqueValues: uniqueValues.size,
          mostCommon: [...uniqueValues].slice(0, 5),
          count: nonNullValues.length
        };
      }
    }
    
    return {
      success: true,
      summary: {
        totalRecords: data.length,
        columns,
        dataTypes,
        missingValues,
        statistics: numericStats,
        source: connection?.source
      }
    };
  }

  private async listConnections(args: any) {
    const connections = this.dataSourceManager.getConnections();
    
    return {
      success: true,
      connections: connections.map(conn => ({
        id: conn.id,
        type: conn.source.type,
        status: conn.status,
        lastUpdated: new Date(conn.lastUpdated).toISOString(),
        config: conn.source.config
      }))
    };
  }

  private async generateDashboard(args: any) {
    const { connectionId, maxVisualizations = 6 } = args;
    
    const data = await this.dataSourceManager.loadData(connectionId);
    const analysis = await this.aiAnalyzer.analyzeData(data);
    
    // Generate top visualizations
    const visualizations = [];
    const suggestedViz = analysis.visualizations.slice(0, maxVisualizations);
    
    for (const vizConfig of suggestedViz) {
      try {
        const viz = await this.visualizationEngine.generateVisualization(vizConfig);
        visualizations.push({
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
      dashboard: {
        title: `Data Analysis Dashboard`,
        generatedAt: new Date().toISOString(),
        dataSource: connectionId,
        summary: {
          totalRecords: data.length,
          patternsFound: analysis.patterns.length,
          visualizationsGenerated: visualizations.length
        },
        patterns: analysis.patterns,
        recommendations: analysis.recommendations,
        visualizations
      }
    };
  }

  private async exportAnalysis(args: any) {
    const { connectionId, format } = args;
    
    const data = await this.dataSourceManager.loadData(connectionId);
    const analysis = await this.aiAnalyzer.analyzeData(data);
    const insights = await this.aiAnalyzer.generateInsights(data, analysis.patterns);
    
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        dataSource: connectionId,
        format,
        totalRecords: data.length
      },
      analysis: {
        patterns: analysis.patterns,
        statistics: analysis.statistics,
        recommendations: analysis.recommendations,
        insights
      },
      suggestedVisualizations: analysis.visualizations
    };
    
    if (format === 'html') {
      const html = this.generateHTMLReport(exportData);
      return {
        success: true,
        export: {
          format: 'html',
          content: html,
          filename: `analysis_report_${connectionId}_${Date.now()}.html`
        }
      };
    } else {
      return {
        success: true,
        export: {
          format: 'json',
          content: JSON.stringify(exportData, null, 2),
          filename: `analysis_report_${connectionId}_${Date.now()}.json`
        }
      };
    }
  }

  private generateHTMLReport(data: any): string {
    const { metadata, analysis } = data;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .pattern { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stat-card { background: #e9ecef; padding: 15px; border-radius: 5px; }
        .recommendation { background: #d4edda; padding: 10px; margin: 5px 0; border-radius: 3px; }
        .insight { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Data Analysis Report</h1>
        <p><strong>Generated:</strong> ${new Date(metadata.exportedAt).toLocaleString()}</p>
        <p><strong>Data Source:</strong> ${metadata.dataSource}</p>
        <p><strong>Total Records:</strong> ${metadata.totalRecords}</p>
    </div>
    
    <div class="section">
        <h2>Detected Patterns</h2>
        ${analysis.patterns.map((pattern: any) => `
            <div class="pattern">
                <h4>${pattern.type.toUpperCase()} - Confidence: ${(pattern.confidence * 100).toFixed(1)}%</h4>
                <p>${pattern.description}</p>
                <p><strong>Affected Columns:</strong> ${pattern.affectedColumns.join(', ')}</p>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>Statistical Summary</h2>
        <div class="stats-grid">
            ${Object.entries(analysis.statistics.mean).map(([col, value]) => `
                <div class="stat-card">
                    <h4>${col}</h4>
                    <p>Mean: ${(value as number).toFixed(2)}</p>
                    <p>Median: ${(analysis.statistics.median[col] as number).toFixed(2)}</p>
                    <p>Std Dev: ${(analysis.statistics.stdDev[col] as number).toFixed(2)}</p>
                </div>
            `).join('')}
        </div>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        ${analysis.recommendations.map((rec: string) => `
            <div class="recommendation">${rec}</div>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>Key Insights</h2>
        ${analysis.insights.map((insight: string) => `
            <div class="insight">${insight}</div>
        `).join('')}
    </div>
</body>
</html>`;
  }
}