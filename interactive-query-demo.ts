#!/usr/bin/env node

/**
 * Interactive Query Interface for DataViz MCP Server
 * Real-time testing environment for natural language queries and MCP tools
 */

import readline from 'readline';
import { DataVizTools } from './src/tools/index.js';
import fs from 'fs';
import path from 'path';

class InteractiveQueryDemo {
  private dataViz: DataVizTools;
  private rl: readline.Interface;
  private connections: Map<string, any> = new Map();
  private currentConnectionId: string | null = null;

  constructor() {
    this.dataViz = new DataVizTools();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 DataViz> '
    });
  }

  async start() {
    this.showWelcome();
    this.showCommands();
    
    // Setup sample data for testing
    await this.setupSampleData();
    
    this.rl.prompt();
    
    this.rl.on('line', async (input) => {
      const query = input.trim();
      
      if (query === 'exit' || query === 'quit') {
        console.log('\n👋 Goodbye!');
        this.rl.close();
        return;
      }
      
      if (query === 'help') {
        this.showCommands();
        this.rl.prompt();
        return;
      }
      
      if (query === 'connections') {
        this.showConnections();
        this.rl.prompt();
        return;
      }
      
      if (query.startsWith('use ')) {
        this.switchConnection(query.substring(4));
        this.rl.prompt();
        return;
      }
      
      if (query === 'examples') {
        await this.showExamples();
        this.rl.prompt();
        return;
      }
      
      if (query.startsWith('/')) {
        await this.handleCommand(query);
      } else if (query.trim()) {
        await this.handleNaturalLanguageQuery(query);
      }
      
      this.rl.prompt();
    });
    
    this.rl.on('close', () => {
      process.exit(0);
    });
  }

  private showWelcome() {
    console.log('\n🚀 DataViz MCP Server - Interactive Query Interface');
    console.log('====================================================');
    console.log('Welcome to the advanced data analysis platform!');
    console.log('Ask questions in natural language or use MCP commands.\n');
  }

  private showCommands() {
    console.log('📋 Available Commands:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🔧 System Commands:');
    console.log('  help              - Show this help menu');
    console.log('  exit/quit         - Exit the interface');
    console.log('  connections       - Show available data connections');
    console.log('  use <id>          - Switch to a data connection');
    console.log('  examples          - Show example queries');
    
    console.log('\n💬 Natural Language Queries (examples):');
    console.log('  "What are the trends in my data?"');
    console.log('  "Show me correlations between variables"');
    console.log('  "Find anomalies in the last month"');
    console.log('  "Compare patterns between datasets"');
    
    console.log('\n🛠️ MCP Tool Commands (prefix with /):');
    console.log('  /discover <directory>           - Auto-discover data sources');
    console.log('  /connect <type> <config>        - Connect to data source');
    console.log('  /patterns                       - Detect advanced patterns');
    console.log('  /fingerprint                    - Generate pattern fingerprint');
    console.log('  /similarity <threshold>         - Find similar patterns');
    console.log('  /compare <id1> <id2>           - Compare two datasets');
    console.log('  /dashboard                      - Generate dashboard');
    console.log('  /export <format>                - Export analysis results');
    
    console.log('\n💡 Pro Tips:');
    console.log('  • Use natural language for exploratory analysis');
    console.log('  • Use MCP commands for specific operations');
    console.log('  • Switch between data sources with "use <id>"');
    console.log('  • Type "examples" for sample queries');
    console.log();
  }

  private async setupSampleData() {
    console.log('🔄 Setting up sample data for testing...');
    
    // Create sample CSV data
    const sampleDir = './sample-data';
    if (!fs.existsSync(sampleDir)) {
      fs.mkdirSync(sampleDir, { recursive: true });
    }
    
    // Generate sample sales data
    const salesData = this.generateSampleSalesData();
    fs.writeFileSync(path.join(sampleDir, 'sales_data.csv'), salesData);
    
    // Generate sample user metrics
    const userMetrics = this.generateSampleUserMetrics();
    fs.writeFileSync(path.join(sampleDir, 'user_metrics.csv'), userMetrics);
    
    // Auto-discover the sample data
    try {
      const result = await this.dataViz.handleToolCall('discover_data_sources', {
        directory: sampleDir,
        autoConnect: true,
        maxConnections: 5
      });
      
      if (result.discovered?.autoConnected) {
        for (const connId of result.discovered.autoConnected) {
          this.connections.set(connId, {
            id: connId,
            status: 'connected',
            type: 'sample_data'
          });
        }
        
        if (result.discovered.autoConnected.length > 0) {
          this.currentConnectionId = result.discovered.autoConnected[0];
        }
      }
      
      console.log(`✅ Sample data ready! Connected to ${this.connections.size} data source(s)`);
      if (this.currentConnectionId) {
        console.log(`🎯 Current connection: ${this.currentConnectionId}`);
      }
    } catch (error) {
      console.log('⚠️  Sample data setup had issues, but you can still test with manual connections');
    }
    
    console.log();
  }

  private generateSampleSalesData(): string {
    const headers = ['Date', 'Product', 'Sales', 'Revenue', 'Region', 'Category'];
    const products = ['ProductA', 'ProductB', 'ProductC', 'ProductD', 'ProductE'];
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports'];
    
    let csv = headers.join(',') + '\n';
    
    const startDate = new Date('2023-01-01');
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const product = products[Math.floor(Math.random() * products.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Add seasonal and trend patterns
      const dayOfYear = i;
      const seasonal = Math.sin(dayOfYear * 2 * Math.PI / 365) * 20;
      const trend = dayOfYear * 0.1;
      const noise = (Math.random() - 0.5) * 30;
      
      const baseSales = 100 + seasonal + trend + noise;
      const sales = Math.max(10, Math.round(baseSales));
      const revenue = sales * (20 + Math.random() * 30);
      
      csv += `${date.toISOString().split('T')[0]},${product},${sales},${revenue.toFixed(2)},${region},${category}\n`;
    }
    
    return csv;
  }

  private generateSampleUserMetrics(): string {
    const headers = ['Date', 'ActiveUsers', 'NewSignups', 'Revenue', 'SessionDuration', 'BounceRate'];
    let csv = headers.join(',') + '\n';
    
    const startDate = new Date('2023-01-01');
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Weekly pattern (higher on weekends)
      const dayOfWeek = date.getDay();
      const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;
      
      // Seasonal pattern
      const seasonal = Math.sin(i * 2 * Math.PI / 365) * 0.2 + 1;
      
      // Growth trend
      const growth = 1 + (i / 365) * 0.5;
      
      const baseUsers = 1000 * weekendBoost * seasonal * growth;
      const activeUsers = Math.round(baseUsers + (Math.random() - 0.5) * 200);
      const newSignups = Math.round(activeUsers * 0.05 + (Math.random() - 0.5) * 10);
      const revenue = activeUsers * (5 + Math.random() * 3);
      const sessionDuration = 180 + Math.random() * 120; // seconds
      const bounceRate = 0.3 + Math.random() * 0.4;
      
      csv += `${date.toISOString().split('T')[0]},${activeUsers},${newSignups},${revenue.toFixed(2)},${sessionDuration.toFixed(1)},${bounceRate.toFixed(3)}\n`;
    }
    
    return csv;
  }

  private showConnections() {
    console.log('\n📊 Available Data Connections:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (this.connections.size === 0) {
      console.log('  No active connections. Use /discover to find data sources.');
      return;
    }
    
    for (const [id, conn] of this.connections.entries()) {
      const indicator = id === this.currentConnectionId ? '🎯' : '  ';
      console.log(`  ${indicator} ${id} (${conn.status})`);
    }
    
    if (this.currentConnectionId) {
      console.log(`\n  Current: ${this.currentConnectionId}`);
    }
    console.log();
  }

  private switchConnection(connectionId: string) {
    if (this.connections.has(connectionId)) {
      this.currentConnectionId = connectionId;
      console.log(`\n✅ Switched to connection: ${connectionId}\n`);
    } else {
      console.log(`\n❌ Connection not found: ${connectionId}`);
      console.log('Available connections:', Array.from(this.connections.keys()).join(', '));
      console.log();
    }
  }

  private async showExamples() {
    console.log('\n💡 Example Queries You Can Try:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const examples = [
      {
        category: '🔍 Pattern Discovery',
        queries: [
          'What patterns do you see in my data?',
          'Show me any trends over time',
          'Find seasonal patterns in the sales data',
          'Are there any cyclical behaviors?'
        ]
      },
      {
        category: '📊 Statistical Analysis',
        queries: [
          'Give me a statistical summary',
          'What are the correlations between variables?',
          'Show me the distribution of sales',
          'What is the average revenue by region?'
        ]
      },
      {
        category: '⚠️ Anomaly Detection',
        queries: [
          'Find anomalies in the last 3 months',
          'Show me unusual spikes in user activity',
          'Which days had abnormal sales patterns?',
          'Detect outliers in the revenue data'
        ]
      },
      {
        category: '📈 Visualization Requests',
        queries: [
          'Create a line chart of sales over time',
          'Show me a scatter plot of revenue vs users',
          'Make a bar chart comparing regions',
          'Generate a heatmap of correlations'
        ]
      },
      {
        category: '🔄 Comparison Queries',
        queries: [
          'Compare this month vs last month',
          'How do weekdays differ from weekends?',
          'Show differences between product categories',
          'Compare user behavior by region'
        ]
      }
    ];
    
    for (const example of examples) {
      console.log(`\n${example.category}:`);
      for (const query of example.queries) {
        console.log(`  "${query}"`);
      }
    }
    
    console.log('\n🛠️ MCP Command Examples:');
    console.log('  /patterns                    - Run advanced pattern detection');
    console.log('  /fingerprint                 - Generate unique data signature');
    console.log('  /dashboard                   - Create comprehensive dashboard');
    console.log('  /discover ./my-data-folder   - Auto-discover new data sources');
    console.log();
  }

  private async handleCommand(command: string) {
    const parts = command.substring(1).split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    console.log(`\n🔧 Executing MCP command: ${command}`);
    
    try {
      switch (cmd) {
        case 'discover':
          await this.handleDiscoverCommand(args);
          break;
        case 'patterns':
          await this.handlePatternsCommand();
          break;
        case 'fingerprint':
          await this.handleFingerprintCommand();
          break;
        case 'similarity':
          await this.handleSimilarityCommand(args);
          break;
        case 'compare':
          await this.handleCompareCommand(args);
          break;
        case 'dashboard':
          await this.handleDashboardCommand();
          break;
        case 'export':
          await this.handleExportCommand(args);
          break;
        default:
          console.log(`❌ Unknown command: ${cmd}`);
          console.log('Type "help" for available commands');
      }
    } catch (error) {
      console.log(`❌ Command failed: ${error}`);
    }
    
    console.log();
  }

  private async handleDiscoverCommand(args: string[]) {
    const directory = args[0] || './sample-data';
    
    console.log(`🔍 Discovering data sources in: ${directory}`);
    
    const result = await this.dataViz.handleToolCall('discover_data_sources', {
      directory,
      autoConnect: true,
      maxConnections: 5
    });
    
    if (result.error) {
      console.log(`❌ Discovery failed: ${result.error}`);
      return;
    }
    
    console.log(`📊 Found ${result.discovered.totalFound} data sources`);
    console.log(`🔗 Auto-connected to ${result.discovered.autoConnected.length} sources`);
    
    // Update connections
    for (const connId of result.discovered.autoConnected) {
      this.connections.set(connId, { id: connId, status: 'connected' });
    }
    
    if (result.discovered.autoConnected.length > 0 && !this.currentConnectionId) {
      this.currentConnectionId = result.discovered.autoConnected[0];
      console.log(`🎯 Current connection set to: ${this.currentConnectionId}`);
    }
  }

  private async handlePatternsCommand() {
    if (!this.currentConnectionId) {
      console.log('❌ No active connection. Use /discover or connect to a data source first.');
      return;
    }
    
    console.log(`🧠 Analyzing patterns in: ${this.currentConnectionId}`);
    
    const result = await this.dataViz.handleToolCall('detect_advanced_patterns', {
      connectionId: this.currentConnectionId
    });
    
    if (result.error) {
      console.log(`❌ Pattern detection failed: ${result.error}`);
      return;
    }
    
    console.log(`🔬 Detected ${result.advancedPatterns.totalPatterns} patterns:`);
    
    for (const patternGroup of result.advancedPatterns.byType.slice(0, 5)) {
      console.log(`  ${patternGroup.type}: ${patternGroup.count} patterns (avg confidence: ${patternGroup.avgConfidence.toFixed(2)})`);
      
      if (patternGroup.patterns.length > 0) {
        const topPattern = patternGroup.patterns[0];
        console.log(`    └ ${topPattern.description}`);
      }
    }
  }

  private async handleFingerprintCommand() {
    if (!this.currentConnectionId) {
      console.log('❌ No active connection. Use /discover or connect to a data source first.');
      return;
    }
    
    console.log(`🔒 Generating pattern fingerprint for: ${this.currentConnectionId}`);
    
    const result = await this.dataViz.handleToolCall('generate_pattern_fingerprint', {
      connectionId: this.currentConnectionId
    });
    
    if (result.error) {
      console.log(`❌ Fingerprinting failed: ${result.error}`);
      return;
    }
    
    const fp = result.fingerprint;
    console.log(`🔑 Fingerprint ID: ${fp.id}`);
    console.log(`📊 Pattern Types: ${fp.patternTypes.join(', ')}`);
    console.log(`💪 Temporal Strength: ${fp.temporalStrength.toFixed(3)}`);
    console.log(`🕸️ Relational Complexity: ${fp.relationalComplexity.toFixed(3)}`);
    console.log(`⚠️ Anomaly Density: ${fp.anomalyDensity.toFixed(3)}`);
  }

  private async handleSimilarityCommand(args: string[]) {
    if (!this.currentConnectionId) {
      console.log('❌ No active connection. Use /discover or connect to a data source first.');
      return;
    }
    
    const threshold = args[0] ? parseFloat(args[0]) : 0.7;
    
    console.log(`🔍 Finding similar patterns (threshold: ${threshold})`);
    
    const result = await this.dataViz.handleToolCall('find_similar_patterns', {
      connectionId: this.currentConnectionId,
      threshold
    });
    
    if (result.error) {
      console.log(`❌ Similarity search failed: ${result.error}`);
      return;
    }
    
    console.log(`📊 Found ${result.totalMatches} similar datasets:`);
    
    for (const match of result.matches.slice(0, 5)) {
      console.log(`  ${match.fingerprintId}: ${(match.similarity * 100).toFixed(1)}% similar`);
      console.log(`    Matching: ${match.matchingFeatures.join(', ')}`);
    }
  }

  private async handleCompareCommand(args: string[]) {
    if (args.length < 2) {
      console.log('❌ Need two connection IDs. Usage: /compare <id1> <id2>');
      return;
    }
    
    const id1 = args[0];
    const id2 = args[1];
    
    console.log(`🔄 Comparing datasets: ${id1} vs ${id2}`);
    
    const result = await this.dataViz.handleToolCall('compare_datasets', {
      connectionId1: id1,
      connectionId2: id2
    });
    
    if (result.error) {
      console.log(`❌ Comparison failed: ${result.error}`);
      return;
    }
    
    const comp = result.comparison;
    console.log(`📊 Overall Similarity: ${(comp.overallSimilarity * 100).toFixed(1)}%`);
    console.log(`🤝 Pattern Overlap: ${comp.patternOverlap.join(', ')}`);
    console.log(`🆕 Unique to ${id1}: ${comp.uniqueToDataset1.join(', ')}`);
    console.log(`🆕 Unique to ${id2}: ${comp.uniqueToDataset2.join(', ')}`);
  }

  private async handleDashboardCommand() {
    if (!this.currentConnectionId) {
      console.log('❌ No active connection. Use /discover or connect to a data source first.');
      return;
    }
    
    console.log(`📈 Generating dashboard for: ${this.currentConnectionId}`);
    
    const result = await this.dataViz.handleToolCall('generate_dashboard', {
      connectionId: this.currentConnectionId,
      maxVisualizations: 6
    });
    
    if (result.error) {
      console.log(`❌ Dashboard generation failed: ${result.error}`);
      return;
    }
    
    const dashboard = result.dashboard;
    console.log(`📊 Dashboard: ${dashboard.title}`);
    console.log(`📈 Summary: ${dashboard.summary.totalRecords} records, ${dashboard.summary.patternsFound} patterns`);
    console.log(`🎨 Generated ${dashboard.summary.visualizationsGenerated} visualizations`);
    
    console.log('\n🔍 Key Patterns:');
    dashboard.patterns.slice(0, 3).forEach((pattern: any, i: number) => {
      console.log(`  ${i + 1}. ${pattern.type.toUpperCase()}: ${pattern.description}`);
    });
  }

  private async handleExportCommand(args: string[]) {
    if (!this.currentConnectionId) {
      console.log('❌ No active connection. Use /discover or connect to a data source first.');
      return;
    }
    
    const format = args[0] || 'json';
    
    console.log(`📤 Exporting analysis in ${format} format`);
    
    const result = await this.dataViz.handleToolCall('export_analysis', {
      connectionId: this.currentConnectionId,
      format
    });
    
    if (result.error) {
      console.log(`❌ Export failed: ${result.error}`);
      return;
    }
    
    const filename = `analysis_export_${Date.now()}.${format}`;
    fs.writeFileSync(filename, result.export.content);
    
    console.log(`✅ Analysis exported to: ${filename}`);
  }

  private async handleNaturalLanguageQuery(query: string) {
    if (!this.currentConnectionId) {
      console.log('❌ No active connection. Use /discover to find data sources first, or type "help" for setup instructions.');
      return;
    }
    
    console.log(`\n💭 Processing: "${query}"`);
    console.log(`📊 Using data source: ${this.currentConnectionId}`);
    
    try {
      const result = await this.dataViz.handleToolCall('ask_natural_language', {
        connectionId: this.currentConnectionId,
        query
      });
      
      if (result.error) {
        console.log(`❌ Query failed: ${result.error}`);
        return;
      }
      
      const nlResult = result.naturalLanguageResult;
      
      console.log(`\n🎯 Intent: ${nlResult.intent.type} (confidence: ${(nlResult.intent.confidence * 100).toFixed(1)}%)`);
      
      if (nlResult.intent.detectedColumns.length > 0) {
        console.log(`📋 Detected columns: ${nlResult.intent.detectedColumns.join(', ')}`);
      }
      
      console.log(`\n💡 Answer:`);
      console.log(nlResult.answer);
      
      if (nlResult.dataInsights.length > 0) {
        console.log(`\n🔍 Key Insights:`);
        nlResult.dataInsights.forEach((insight: string, i: number) => {
          console.log(`  ${i + 1}. ${insight}`);
        });
      }
      
      if (nlResult.visualizations.length > 0) {
        console.log(`\n📊 Generated ${nlResult.visualizations.length} visualization(s):`);
        nlResult.visualizations.forEach((viz: any, i: number) => {
          console.log(`  ${i + 1}. ${viz.config.type.toUpperCase()}: ${viz.config.title || 'Untitled'}`);
          console.log(`     Size: ${viz.metadata.width}x${viz.metadata.height}, Data points: ${viz.metadata.dataPoints}`);
        });
      }
      
      if (nlResult.suggestedFollowups.length > 0) {
        console.log(`\n🤔 You might also ask:`);
        nlResult.suggestedFollowups.slice(0, 3).forEach((followup: string, i: number) => {
          console.log(`  ${i + 1}. "${followup}"`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Query processing failed: ${error}`);
    }
    
    console.log();
  }
}

// Start the interactive demo
const demo = new InteractiveQueryDemo();

async function main() {
  await demo.start();
}

if (require.main === module) {
  main().catch(console.error);
}