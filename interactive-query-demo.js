#!/usr/bin/env node

/**
 * Interactive Query Interface for DataViz MCP Server
 * Simplified JavaScript version for immediate testing
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';

// Simple statistics functions
const stats = {
  mean: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
  median: (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  },
  std: (arr) => {
    const mean = stats.mean(arr);
    const sqDiffs = arr.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(stats.mean(sqDiffs));
  },
  correlation: (x, y) => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
    const sumX2 = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
    const sumY2 = y.map(yi => yi * yi).reduce((a, b) => a + b, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
};

class InteractiveQueryDemo {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 DataViz> '
    });
    this.currentData = null;
    this.connections = new Map();
  }

  async start() {
    this.showWelcome();
    await this.setupSampleData();
    this.showCommands();
    
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
      
      if (query === 'examples') {
        this.showExamples();
        this.rl.prompt();
        return;
      }
      
      if (query === 'data') {
        this.showDataSummary();
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

  showWelcome() {
    console.log('\n🚀 DataViz MCP Server - Interactive Query Interface');
    console.log('====================================================');
    console.log('Welcome! Ask questions about your data in natural language.');
    console.log('This demo shows the advanced analytics capabilities.\n');
  }

  showCommands() {
    console.log('📋 Available Commands:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  help              - Show this help menu');
    console.log('  examples          - Show example queries');
    console.log('  data              - Show current data summary');
    console.log('  exit/quit         - Exit the interface');
    console.log('');
    console.log('💬 Try Natural Language Queries:');
    console.log('  "What trends do you see in the sales data?"');
    console.log('  "Show me correlations between revenue and sales"');
    console.log('  "Find patterns in the user metrics"');
    console.log('  "What are the statistical summaries?"');
    console.log('');
  }

  async setupSampleData() {
    console.log('🔄 Setting up sample data...');
    
    // Generate sample sales data
    const salesData = [];
    const startDate = new Date('2023-01-01');
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Add seasonal and trend patterns
      const dayOfYear = i;
      const seasonal = Math.sin(dayOfYear * 2 * Math.PI / 365) * 20;
      const trend = dayOfYear * 0.1;
      const weekdayBoost = (date.getDay() === 0 || date.getDay() === 6) ? 1.2 : 1.0;
      const noise = (Math.random() - 0.5) * 30;
      
      const baseSales = 100 + seasonal + trend + noise;
      const sales = Math.max(10, Math.round(baseSales * weekdayBoost));
      const revenue = sales * (20 + Math.random() * 30);
      const users = Math.round(sales * 0.8 + Math.random() * 50);
      
      salesData.push({
        date: date.toISOString().split('T')[0],
        sales: sales,
        revenue: Math.round(revenue * 100) / 100,
        users: users,
        dayOfWeek: date.getDay(),
        month: date.getMonth() + 1,
        quarter: Math.floor(date.getMonth() / 3) + 1
      });
    }
    
    this.currentData = salesData;
    this.connections.set('sample_data', { type: 'generated', records: salesData.length });
    
    console.log(`✅ Sample data ready! ${salesData.length} records loaded`);
    console.log('🎯 Try asking: "What trends do you see in the sales data?"\n');
  }

  showExamples() {
    console.log('\n💡 Example Queries You Can Try:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const examples = [
      {
        category: '🔍 Pattern Discovery',
        queries: [
          'What patterns do you see in the sales data?',
          'Show me trends in revenue over time',
          'Are there seasonal patterns?',
          'How do weekends compare to weekdays?'
        ]
      },
      {
        category: '📊 Statistical Analysis', 
        queries: [
          'Give me statistical summaries',
          'What correlations exist between sales and revenue?',
          'Show me the distribution of daily sales',
          'What are the average sales by month?'
        ]
      },
      {
        category: '⚠️ Anomaly Detection',
        queries: [
          'Find unusual spikes in the data',
          'Which days had abnormal sales?',
          'Show me outliers in revenue',
          'Detect anomalous patterns'
        ]
      },
      {
        category: '🔄 Comparative Analysis',
        queries: [
          'Compare Q1 vs Q4 performance',
          'How do different months compare?',
          'Show seasonal differences',
          'Compare weekend vs weekday patterns'
        ]
      }
    ];
    
    for (const example of examples) {
      console.log(`\n${example.category}:`);
      for (const query of example.queries) {
        console.log(`  "${query}"`);
      }
    }
    console.log('');
  }

  showDataSummary() {
    if (!this.currentData) {
      console.log('\n❌ No data loaded');
      return;
    }
    
    console.log('\n📊 Current Data Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Records: ${this.currentData.length}`);
    console.log(`Date Range: ${this.currentData[0].date} to ${this.currentData[this.currentData.length-1].date}`);
    
    const sales = this.currentData.map(d => d.sales);
    const revenue = this.currentData.map(d => d.revenue);
    const users = this.currentData.map(d => d.users);
    
    console.log('\n📈 Sales Statistics:');
    console.log(`  Mean: ${stats.mean(sales).toFixed(2)}`);
    console.log(`  Median: ${stats.median(sales).toFixed(2)}`);
    console.log(`  Std Dev: ${stats.std(sales).toFixed(2)}`);
    console.log(`  Range: ${Math.min(...sales)} - ${Math.max(...sales)}`);
    
    console.log('\n💰 Revenue Statistics:');
    console.log(`  Mean: $${stats.mean(revenue).toFixed(2)}`);
    console.log(`  Median: $${stats.median(revenue).toFixed(2)}`);
    console.log(`  Total: $${revenue.reduce((a, b) => a + b, 0).toFixed(2)}`);
    
    console.log('\n👥 User Statistics:');
    console.log(`  Mean: ${stats.mean(users).toFixed(2)}`);
    console.log(`  Total Unique: ${users.reduce((a, b) => a + b, 0)}`);
    
    const correlation = stats.correlation(sales, revenue);
    console.log(`\n🔗 Sales-Revenue Correlation: ${correlation.toFixed(3)}`);
    console.log('');
  }

  async handleCommand(command) {
    console.log(`\n🔧 Processing command: ${command}`);
    
    switch (command) {
      case '/patterns':
        this.analyzePatterns();
        break;
      case '/trends':
        this.analyzeTrends();
        break;
      case '/correlations':
        this.analyzeCorrelations();
        break;
      case '/anomalies':
        this.detectAnomalies();
        break;
      case '/seasonal':
        this.analyzeSeasonality();
        break;
      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('Available: /patterns, /trends, /correlations, /anomalies, /seasonal');
    }
    console.log('');
  }

  analyzePatterns() {
    if (!this.currentData) return;
    
    console.log('🧠 Advanced Pattern Analysis:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const sales = this.currentData.map(d => d.sales);
    const revenue = this.currentData.map(d => d.revenue);
    const users = this.currentData.map(d => d.users);
    
    // Trend detection
    const indices = sales.map((_, i) => i);
    const salesTrend = this.calculateTrend(indices, sales);
    const revenueTrend = this.calculateTrend(indices, revenue);
    
    console.log('\n📈 Trend Patterns:');
    console.log(`  Sales trend: ${salesTrend > 0 ? 'Increasing' : 'Decreasing'} (slope: ${salesTrend.toFixed(4)})`);
    console.log(`  Revenue trend: ${revenueTrend > 0 ? 'Increasing' : 'Decreasing'} (slope: ${revenueTrend.toFixed(4)})`);
    
    // Correlation patterns
    const salesRevenueCorr = stats.correlation(sales, revenue);
    const salesUsersCorr = stats.correlation(sales, users);
    
    console.log('\n🔗 Correlation Patterns:');
    console.log(`  Sales ↔ Revenue: ${salesRevenueCorr.toFixed(3)} (${this.getCorrelationStrength(salesRevenueCorr)})`);
    console.log(`  Sales ↔ Users: ${salesUsersCorr.toFixed(3)} (${this.getCorrelationStrength(salesUsersCorr)})`);
    
    // Volatility patterns
    const salesVolatility = stats.std(sales) / stats.mean(sales);
    const revenueVolatility = stats.std(revenue) / stats.mean(revenue);
    
    console.log('\n📊 Volatility Patterns:');
    console.log(`  Sales volatility: ${(salesVolatility * 100).toFixed(1)}%`);
    console.log(`  Revenue volatility: ${(revenueVolatility * 100).toFixed(1)}%`);
    
    // Weekend effect
    const weekdayData = this.currentData.filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5);
    const weekendData = this.currentData.filter(d => d.dayOfWeek === 0 || d.dayOfWeek === 6);
    
    const weekdayAvg = stats.mean(weekdayData.map(d => d.sales));
    const weekendAvg = stats.mean(weekendData.map(d => d.sales));
    const weekendEffect = ((weekendAvg - weekdayAvg) / weekdayAvg * 100);
    
    console.log('\n📅 Weekly Patterns:');
    console.log(`  Weekday average: ${weekdayAvg.toFixed(2)}`);
    console.log(`  Weekend average: ${weekendAvg.toFixed(2)}`);
    console.log(`  Weekend effect: ${weekendEffect > 0 ? '+' : ''}${weekendEffect.toFixed(1)}%`);
  }

  analyzeTrends() {
    if (!this.currentData) return;
    
    console.log('📈 Trend Analysis:');
    console.log('━━━━━━━━━━━━━━━━━━━');
    
    const sales = this.currentData.map(d => d.sales);
    const indices = sales.map((_, i) => i);
    const trend = this.calculateTrend(indices, sales);
    
    console.log(`\n📊 Overall Trend: ${trend > 0 ? 'Upward' : 'Downward'}`);
    console.log(`   Slope: ${trend.toFixed(6)} units per day`);
    console.log(`   Annual change: ${(trend * 365).toFixed(2)} units`);
    
    // Monthly trends
    const monthlyAvg = {};
    for (let month = 1; month <= 12; month++) {
      const monthData = this.currentData.filter(d => d.month === month);
      if (monthData.length > 0) {
        monthlyAvg[month] = stats.mean(monthData.map(d => d.sales));
      }
    }
    
    console.log('\n📅 Monthly Averages:');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let month = 1; month <= 12; month++) {
      if (monthlyAvg[month]) {
        console.log(`   ${months[month-1]}: ${monthlyAvg[month].toFixed(2)}`);
      }
    }
    
    // Quarterly trends
    const quarterlyAvg = {};
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterData = this.currentData.filter(d => d.quarter === quarter);
      quarterlyAvg[quarter] = stats.mean(quarterData.map(d => d.sales));
    }
    
    console.log('\n📊 Quarterly Averages:');
    for (let quarter = 1; quarter <= 4; quarter++) {
      console.log(`   Q${quarter}: ${quarterlyAvg[quarter].toFixed(2)}`);
    }
  }

  analyzeCorrelations() {
    if (!this.currentData) return;
    
    console.log('🔗 Correlation Analysis:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const sales = this.currentData.map(d => d.sales);
    const revenue = this.currentData.map(d => d.revenue);
    const users = this.currentData.map(d => d.users);
    const dayOfWeek = this.currentData.map(d => d.dayOfWeek);
    const month = this.currentData.map(d => d.month);
    
    const correlations = [
      { name: 'Sales ↔ Revenue', corr: stats.correlation(sales, revenue) },
      { name: 'Sales ↔ Users', corr: stats.correlation(sales, users) },
      { name: 'Revenue ↔ Users', corr: stats.correlation(revenue, users) },
      { name: 'Sales ↔ Day of Week', corr: stats.correlation(sales, dayOfWeek) },
      { name: 'Sales ↔ Month', corr: stats.correlation(sales, month) }
    ];
    
    console.log('\n📊 Correlation Matrix:');
    for (const { name, corr } of correlations) {
      const strength = this.getCorrelationStrength(corr);
      const bar = this.getCorrelationBar(corr);
      console.log(`   ${name.padEnd(20)}: ${bar} ${corr.toFixed(3)} (${strength})`);
    }
    
    // Find strongest correlations
    const strongest = correlations.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr))[0];
    console.log(`\n🏆 Strongest correlation: ${strongest.name} (${strongest.corr.toFixed(3)})`);
    
    // Interpretation
    console.log('\n💡 Insights:');
    if (Math.abs(strongest.corr) > 0.8) {
      console.log(`   • Very strong relationship between ${strongest.name.replace(' ↔ ', ' and ')}`);
    } else if (Math.abs(strongest.corr) > 0.6) {
      console.log(`   • Strong relationship between ${strongest.name.replace(' ↔ ', ' and ')}`);
    } else {
      console.log(`   • Moderate relationships detected, no dominant correlations`);
    }
  }

  detectAnomalies() {
    if (!this.currentData) return;
    
    console.log('⚠️  Anomaly Detection:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    
    const sales = this.currentData.map(d => d.sales);
    const mean = stats.mean(sales);
    const stdDev = stats.std(sales);
    const threshold = 2; // 2 standard deviations
    
    const anomalies = [];
    this.currentData.forEach((record, index) => {
      const zScore = Math.abs((record.sales - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          index,
          date: record.date,
          value: record.sales,
          zScore: zScore,
          type: record.sales > mean ? 'High' : 'Low'
        });
      }
    });
    
    console.log(`\n📊 Detection Results:`);
    console.log(`   Threshold: ${threshold} standard deviations`);
    console.log(`   Mean: ${mean.toFixed(2)}, Std Dev: ${stdDev.toFixed(2)}`);
    console.log(`   Anomalies found: ${anomalies.length} (${(anomalies.length/this.currentData.length*100).toFixed(1)}%)`);
    
    if (anomalies.length > 0) {
      console.log('\n🔍 Top Anomalies:');
      const topAnomalies = anomalies.sort((a, b) => b.zScore - a.zScore).slice(0, 5);
      
      topAnomalies.forEach((anomaly, i) => {
        console.log(`   ${i+1}. ${anomaly.date}: ${anomaly.value} (${anomaly.type}, Z-score: ${anomaly.zScore.toFixed(2)})`);
      });
      
      // Anomaly patterns
      const highAnomalies = anomalies.filter(a => a.type === 'High').length;
      const lowAnomalies = anomalies.filter(a => a.type === 'Low').length;
      
      console.log('\n📊 Anomaly Breakdown:');
      console.log(`   High values: ${highAnomalies} anomalies`);
      console.log(`   Low values: ${lowAnomalies} anomalies`);
      
      // Monthly anomaly distribution
      const monthlyAnomalies = {};
      anomalies.forEach(a => {
        const month = new Date(a.date).getMonth() + 1;
        monthlyAnomalies[month] = (monthlyAnomalies[month] || 0) + 1;
      });
      
      if (Object.keys(monthlyAnomalies).length > 0) {
        console.log('\n📅 Monthly Distribution:');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        Object.entries(monthlyAnomalies).forEach(([month, count]) => {
          console.log(`   ${months[month-1]}: ${count} anomalies`);
        });
      }
    }
  }

  analyzeSeasonality() {
    if (!this.currentData) return;
    
    console.log('🔄 Seasonality Analysis:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Monthly seasonality
    const monthlyData = {};
    for (let month = 1; month <= 12; month++) {
      const monthData = this.currentData.filter(d => d.month === month);
      monthlyData[month] = {
        avg: stats.mean(monthData.map(d => d.sales)),
        count: monthData.length
      };
    }
    
    const monthlyAvgs = Object.values(monthlyData).map(d => d.avg);
    const overallAvg = stats.mean(monthlyAvgs);
    const seasonalVariance = stats.std(monthlyAvgs) / overallAvg;
    
    console.log(`\n📊 Seasonal Strength: ${(seasonalVariance * 100).toFixed(1)}%`);
    console.log(`   Overall average: ${overallAvg.toFixed(2)}`);
    console.log(`   Monthly variance: ${(stats.std(monthlyAvgs)).toFixed(2)}`);
    
    console.log('\n📅 Monthly Seasonal Index:');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let month = 1; month <= 12; month++) {
      const index = monthlyData[month].avg / overallAvg;
      const indicator = index > 1.1 ? '📈' : index < 0.9 ? '📉' : '➡️';
      console.log(`   ${months[month-1]}: ${indicator} ${index.toFixed(2)} (${monthlyData[month].avg.toFixed(2)})`);
    }
    
    // Quarterly seasonality
    const quarterlyData = {};
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterData = this.currentData.filter(d => d.quarter === quarter);
      quarterlyData[quarter] = stats.mean(quarterData.map(d => d.sales));
    }
    
    console.log('\n📊 Quarterly Patterns:');
    for (let quarter = 1; quarter <= 4; quarter++) {
      const index = quarterlyData[quarter] / overallAvg;
      const indicator = index > 1.05 ? '📈' : index < 0.95 ? '📉' : '➡️';
      console.log(`   Q${quarter}: ${indicator} ${index.toFixed(2)} (${quarterlyData[quarter].toFixed(2)})`);
    }
    
    // Weekly seasonality (day of week)
    const weeklyData = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let day = 0; day <= 6; day++) {
      const dayData = this.currentData.filter(d => d.dayOfWeek === day);
      weeklyData[day] = stats.mean(dayData.map(d => d.sales));
    }
    
    console.log('\n📅 Weekly Patterns:');
    for (let day = 0; day <= 6; day++) {
      const index = weeklyData[day] / overallAvg;
      const indicator = index > 1.05 ? '📈' : index < 0.95 ? '📉' : '➡️';
      console.log(`   ${dayNames[day]}: ${indicator} ${index.toFixed(2)} (${weeklyData[day].toFixed(2)})`);
    }
  }

  async handleNaturalLanguageQuery(query) {
    console.log(`\n💭 Processing: "${query}"`);
    
    if (!this.currentData) {
      console.log('❌ No data available for analysis');
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    
    // Intent detection
    let intent = 'general';
    if (lowerQuery.includes('trend') || lowerQuery.includes('growth') || lowerQuery.includes('increase') || lowerQuery.includes('decrease')) {
      intent = 'trend_analysis';
    } else if (lowerQuery.includes('correlation') || lowerQuery.includes('relationship') || lowerQuery.includes('related')) {
      intent = 'correlation_analysis';
    } else if (lowerQuery.includes('anomal') || lowerQuery.includes('outlier') || lowerQuery.includes('unusual') || lowerQuery.includes('spike')) {
      intent = 'anomaly_detection';
    } else if (lowerQuery.includes('seasonal') || lowerQuery.includes('month') || lowerQuery.includes('quarter') || lowerQuery.includes('week')) {
      intent = 'seasonality_analysis';
    } else if (lowerQuery.includes('pattern') || lowerQuery.includes('behavior')) {
      intent = 'pattern_analysis';
    } else if (lowerQuery.includes('statistic') || lowerQuery.includes('summary') || lowerQuery.includes('average') || lowerQuery.includes('mean')) {
      intent = 'statistical_summary';
    }
    
    console.log(`🎯 Detected intent: ${intent.replace('_', ' ')}`);
    console.log(`\n💡 Analysis Results:`);
    
    switch (intent) {
      case 'trend_analysis':
        this.respondToTrendQuery(query);
        break;
      case 'correlation_analysis':
        this.respondToCorrelationQuery(query);
        break;
      case 'anomaly_detection':
        this.respondToAnomalyQuery(query);
        break;
      case 'seasonality_analysis':
        this.respondToSeasonalityQuery(query);
        break;
      case 'pattern_analysis':
        this.respondToPatternQuery(query);
        break;
      case 'statistical_summary':
        this.respondToStatisticalQuery(query);
        break;
      default:
        this.respondToGeneralQuery(query);
    }
    
    console.log('\n🤔 You might also ask:');
    console.log('  • "Show me the correlation between sales and revenue"');
    console.log('  • "What seasonal patterns exist in the data?"');
    console.log('  • "Find any unusual spikes or drops in sales"');
    console.log('');
  }

  respondToTrendQuery(query) {
    const sales = this.currentData.map(d => d.sales);
    const indices = sales.map((_, i) => i);
    const trend = this.calculateTrend(indices, sales);
    
    console.log(`📈 Sales show a ${trend > 0 ? 'positive' : 'negative'} trend over time`);
    console.log(`   • Slope: ${trend.toFixed(4)} units per day`);
    console.log(`   • Annual change: ${(trend * 365 > 0 ? '+' : '')}${(trend * 365).toFixed(2)} units`);
    
    const firstMonth = stats.mean(this.currentData.slice(0, 30).map(d => d.sales));
    const lastMonth = stats.mean(this.currentData.slice(-30).map(d => d.sales));
    const change = ((lastMonth - firstMonth) / firstMonth * 100);
    
    console.log(`   • First month average: ${firstMonth.toFixed(2)}`);
    console.log(`   • Last month average: ${lastMonth.toFixed(2)}`);
    console.log(`   • Overall change: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`);
  }

  respondToCorrelationQuery(query) {
    const sales = this.currentData.map(d => d.sales);
    const revenue = this.currentData.map(d => d.revenue);
    const users = this.currentData.map(d => d.users);
    
    const salesRevenueCorr = stats.correlation(sales, revenue);
    const salesUsersCorr = stats.correlation(sales, users);
    const revenueUsersCorr = stats.correlation(revenue, users);
    
    console.log('🔗 Key correlations in your data:');
    console.log(`   • Sales & Revenue: ${salesRevenueCorr.toFixed(3)} (${this.getCorrelationStrength(salesRevenueCorr)})`);
    console.log(`   • Sales & Users: ${salesUsersCorr.toFixed(3)} (${this.getCorrelationStrength(salesUsersCorr)})`);
    console.log(`   • Revenue & Users: ${revenueUsersCorr.toFixed(3)} (${this.getCorrelationStrength(revenueUsersCorr)})`);
    
    if (Math.abs(salesRevenueCorr) > 0.8) {
      console.log('\n💡 Strong relationship detected between sales and revenue');
      console.log('   This suggests consistent pricing or profit margins');
    }
  }

  respondToAnomalyQuery(query) {
    const sales = this.currentData.map(d => d.sales);
    const mean = stats.mean(sales);
    const stdDev = stats.std(sales);
    
    const anomalies = this.currentData.filter((d, i) => {
      const zScore = Math.abs((d.sales - mean) / stdDev);
      return zScore > 2;
    });
    
    console.log(`⚠️  Found ${anomalies.length} anomalous days (${(anomalies.length/this.currentData.length*100).toFixed(1)}% of data)`);
    
    if (anomalies.length > 0) {
      const topAnomalies = anomalies.sort((a, b) => 
        Math.abs(b.sales - mean) - Math.abs(a.sales - mean)
      ).slice(0, 3);
      
      console.log('\n🔍 Most unusual days:');
      topAnomalies.forEach((anomaly, i) => {
        const deviation = ((anomaly.sales - mean) / mean * 100);
        console.log(`   ${i+1}. ${anomaly.date}: ${anomaly.sales} sales (${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}% from average)`);
      });
    } else {
      console.log('   No significant anomalies detected (within 2 standard deviations)');
    }
  }

  respondToSeasonalityQuery(query) {
    const monthlyData = {};
    for (let month = 1; month <= 12; month++) {
      const monthData = this.currentData.filter(d => d.month === month);
      if (monthData.length > 0) {
        monthlyData[month] = stats.mean(monthData.map(d => d.sales));
      }
    }
    
    const monthlyAvgs = Object.values(monthlyData);
    const overallAvg = stats.mean(monthlyAvgs);
    const seasonalVariance = stats.std(monthlyAvgs) / overallAvg;
    
    console.log(`🔄 Seasonal analysis shows ${(seasonalVariance * 100).toFixed(1)}% seasonal variation`);
    
    // Find peak and low months
    const maxMonth = Object.keys(monthlyData).reduce((a, b) => 
      monthlyData[a] > monthlyData[b] ? a : b);
    const minMonth = Object.keys(monthlyData).reduce((a, b) => 
      monthlyData[a] < monthlyData[b] ? a : b);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    console.log(`   • Peak month: ${months[maxMonth-1]} (${monthlyData[maxMonth].toFixed(2)} avg sales)`);
    console.log(`   • Low month: ${months[minMonth-1]} (${monthlyData[minMonth].toFixed(2)} avg sales)`);
    
    const peakLowDiff = ((monthlyData[maxMonth] - monthlyData[minMonth]) / monthlyData[minMonth] * 100);
    console.log(`   • Peak-to-trough difference: ${peakLowDiff.toFixed(1)}%`);
    
    // Weekend effect
    const weekdayAvg = stats.mean(this.currentData.filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5).map(d => d.sales));
    const weekendAvg = stats.mean(this.currentData.filter(d => d.dayOfWeek === 0 || d.dayOfWeek === 6).map(d => d.sales));
    const weekendEffect = ((weekendAvg - weekdayAvg) / weekdayAvg * 100);
    
    console.log(`   • Weekend effect: ${weekendEffect > 0 ? '+' : ''}${weekendEffect.toFixed(1)}% vs weekdays`);
  }

  respondToPatternQuery(query) {
    console.log('🧠 Comprehensive pattern analysis:');
    
    const sales = this.currentData.map(d => d.sales);
    const revenue = this.currentData.map(d => d.revenue);
    const correlation = stats.correlation(sales, revenue);
    
    // Trend pattern
    const indices = sales.map((_, i) => i);
    const trend = this.calculateTrend(indices, sales);
    console.log(`   📈 Trend: ${trend > 0 ? 'Upward' : 'Downward'} (${Math.abs(trend * 365).toFixed(2)} units/year)`);
    
    // Volatility pattern
    const volatility = stats.std(sales) / stats.mean(sales);
    console.log(`   📊 Volatility: ${(volatility * 100).toFixed(1)}% coefficient of variation`);
    
    // Correlation pattern
    console.log(`   🔗 Sales-Revenue correlation: ${correlation.toFixed(3)} (${this.getCorrelationStrength(correlation)})`);
    
    // Weekly pattern
    const weekdayAvg = stats.mean(this.currentData.filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5).map(d => d.sales));
    const weekendAvg = stats.mean(this.currentData.filter(d => d.dayOfWeek === 0 || d.dayOfWeek === 6).map(d => d.sales));
    const weekendEffect = ((weekendAvg - weekdayAvg) / weekdayAvg * 100);
    console.log(`   📅 Weekly pattern: ${Math.abs(weekendEffect) > 5 ? 'Strong' : 'Weak'} weekend effect (${weekendEffect > 0 ? '+' : ''}${weekendEffect.toFixed(1)}%)`);
    
    // Seasonal pattern
    const monthlyAvgs = [];
    for (let month = 1; month <= 12; month++) {
      const monthData = this.currentData.filter(d => d.month === month);
      if (monthData.length > 0) {
        monthlyAvgs.push(stats.mean(monthData.map(d => d.sales)));
      }
    }
    const seasonalVariance = stats.std(monthlyAvgs) / stats.mean(monthlyAvgs);
    console.log(`   🔄 Seasonal pattern: ${seasonalVariance > 0.15 ? 'Strong' : 'Weak'} seasonality (${(seasonalVariance * 100).toFixed(1)}% variation)`);
  }

  respondToStatisticalQuery(query) {
    const sales = this.currentData.map(d => d.sales);
    const revenue = this.currentData.map(d => d.revenue);
    const users = this.currentData.map(d => d.users);
    
    console.log('📊 Statistical Summary:');
    console.log('\n💰 Sales Statistics:');
    console.log(`   • Mean: ${stats.mean(sales).toFixed(2)}`);
    console.log(`   • Median: ${stats.median(sales).toFixed(2)}`);
    console.log(`   • Std Dev: ${stats.std(sales).toFixed(2)}`);
    console.log(`   • Range: ${Math.min(...sales)} - ${Math.max(...sales)}`);
    console.log(`   • Total: ${sales.reduce((a, b) => a + b, 0)}`);
    
    console.log('\n💸 Revenue Statistics:');
    console.log(`   • Mean: $${stats.mean(revenue).toFixed(2)}`);
    console.log(`   • Median: $${stats.median(revenue).toFixed(2)}`);
    console.log(`   • Std Dev: $${stats.std(revenue).toFixed(2)}`);
    console.log(`   • Total: $${revenue.reduce((a, b) => a + b, 0).toFixed(2)}`);
    
    console.log('\n👥 User Statistics:');
    console.log(`   • Mean: ${stats.mean(users).toFixed(2)}`);
    console.log(`   • Median: ${stats.median(users).toFixed(2)}`);
    console.log(`   • Total: ${users.reduce((a, b) => a + b, 0)}`);
    
    console.log('\n🔗 Key Relationships:');
    console.log(`   • Sales-Revenue correlation: ${stats.correlation(sales, revenue).toFixed(3)}`);
    console.log(`   • Sales-Users correlation: ${stats.correlation(sales, users).toFixed(3)}`);
    console.log(`   • Average revenue per sale: $${(stats.mean(revenue) / stats.mean(sales)).toFixed(2)}`);
  }

  respondToGeneralQuery(query) {
    // Check if user is asking for a specific visualization
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('scatter') && (lowerQuery.includes('revenue') || lowerQuery.includes('sales'))) {
      this.generateScatterPlot('revenue', 'sales', 'Revenue vs Sales');
      return;
    }
    
    if (lowerQuery.includes('line chart') || lowerQuery.includes('trend chart')) {
      this.generateLineChart('sales', 'Sales Trend Over Time');
      return;
    }
    
    if (lowerQuery.includes('bar chart') || lowerQuery.includes('histogram')) {
      this.generateBarChart();
      return;
    }
    
    console.log('🎯 I can help you analyze your data in several ways:');
    console.log('   • Trend analysis - "Show me trends over time"');
    console.log('   • Pattern detection - "What patterns do you see?"');
    console.log('   • Anomaly detection - "Find unusual data points"');
    console.log('   • Statistical summaries - "Give me statistics"');
    console.log('   • Correlation analysis - "Show relationships between variables"');
    console.log('   • Seasonal analysis - "Are there seasonal patterns?"');
    console.log('   • Visualizations - "Create a scatter plot of revenue vs sales"');
    
    // Give a quick overview
    console.log('\n📊 Quick Data Overview:');
    const sales = this.currentData.map(d => d.sales);
    const trend = this.calculateTrend(sales.map((_, i) => i), sales);
    console.log(`   • ${this.currentData.length} records analyzed`);
    console.log(`   • Sales trend: ${trend > 0 ? 'Increasing' : 'Decreasing'}`);
    console.log(`   • Average daily sales: ${stats.mean(sales).toFixed(2)}`);
    
    console.log('\n🤔 You might also ask:');
    console.log('  • "Show me the correlation between sales and revenue"');
    console.log('  • "What seasonal patterns exist in the data?"');
    console.log('  • "Find any unusual spikes or drops in sales"');
  }

  // Visualization Generation Functions
  generateScatterPlot(xField, yField, title) {
    console.log(`\n🎨 Generating scatter plot: ${title}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const xData = this.currentData.map(d => d[xField]);
    const yData = this.currentData.map(d => d[yField]);
    
    // Create SVG
    const width = 600;
    const height = 400;
    const margin = { top: 50, right: 50, bottom: 50, left: 70 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    
    const xMin = Math.min(...xData);
    const xMax = Math.max(...xData);
    const yMin = Math.min(...yData);
    const yMax = Math.max(...yData);
    
    const svg = this.createSVGHeader(width, height, title);
    
    // Add axes
    svg += this.createAxes(margin, plotWidth, plotHeight, xMin, xMax, yMin, yMax, xField, yField);
    
    // Add data points
    const points = [];
    for (let i = 0; i < xData.length; i++) {
      const x = margin.left + ((xData[i] - xMin) / (xMax - xMin)) * plotWidth;
      const y = height - margin.bottom - ((yData[i] - yMin) / (yMax - yMin)) * plotHeight;
      points.push(`<circle cx="${x}" cy="${y}" r="3" fill="#3498db" opacity="0.7"/>`);
    }
    svg += points.join('\n');
    
    // Add correlation info
    const correlation = stats.correlation(xData, yData);
    svg += `<text x="${width - margin.right}" y="${margin.top - 10}" text-anchor="end" font-size="14" fill="#34495e">r = ${correlation.toFixed(3)}</text>`;
    
    svg += '</svg>';
    
    const filename = `scatter_${xField}_vs_${yField}.svg`;
    fs.writeFileSync(filename, svg);
    
    console.log(`✅ Scatter plot saved as: ${filename}`);
    console.log(`📊 Correlation: ${correlation.toFixed(3)} (${this.getCorrelationStrength(correlation)})`);
    console.log(`📈 Data points: ${xData.length}`);
    console.log(`🔍 X range: ${xMin.toFixed(2)} - ${xMax.toFixed(2)}`);
    console.log(`🔍 Y range: ${yMin.toFixed(2)} - ${yMax.toFixed(2)}`);
  }

  generateLineChart(field, title) {
    console.log(`\n📈 Generating line chart: ${title}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const data = this.currentData.map(d => d[field]);
    const width = 800;
    const height = 400;
    const margin = { top: 50, right: 50, bottom: 50, left: 70 };
    
    const svg = this.createSVGHeader(width, height, title);
    const yMin = Math.min(...data);
    const yMax = Math.max(...data);
    
    // Create path
    const points = [];
    for (let i = 0; i < data.length; i++) {
      const x = margin.left + (i / (data.length - 1)) * (width - margin.left - margin.right);
      const y = height - margin.bottom - ((data[i] - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    
    svg += `<path d="${points.join(' ')}" stroke="#3498db" stroke-width="2" fill="none"/>`;
    svg += `<text x="${margin.left}" y="${margin.top - 20}" font-size="12" fill="#7f8c8d">${field.toUpperCase()}</text>`;
    svg += '</svg>';
    
    const filename = `line_${field}.svg`;
    fs.writeFileSync(filename, svg);
    
    console.log(`✅ Line chart saved as: ${filename}`);
    console.log(`📊 Data points: ${data.length}`);
    console.log(`📈 Range: ${yMin.toFixed(2)} - ${yMax.toFixed(2)}`);
    
    const trend = this.calculateTrend(data.map((_, i) => i), data);
    console.log(`📊 Trend: ${trend > 0 ? 'Increasing' : 'Decreasing'} (slope: ${trend.toFixed(4)})`);
  }

  generateBarChart() {
    console.log(`\n📊 Generating monthly bar chart`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Group by month
    const monthlyData = {};
    this.currentData.forEach(d => {
      if (!monthlyData[d.month]) monthlyData[d.month] = [];
      monthlyData[d.month].push(d.sales);
    });
    
    const monthlyAvgs = {};
    Object.keys(monthlyData).forEach(month => {
      monthlyAvgs[month] = stats.mean(monthlyData[month]);
    });
    
    const width = 600;
    const height = 400;
    const margin = { top: 50, right: 50, bottom: 50, left: 70 };
    
    const svg = this.createSVGHeader(width, height, 'Monthly Average Sales');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const values = Object.values(monthlyAvgs);
    const maxVal = Math.max(...values);
    const barWidth = (width - margin.left - margin.right) / 12;
    
    Object.keys(monthlyAvgs).forEach(month => {
      const x = margin.left + (month - 1) * barWidth;
      const barHeight = (monthlyAvgs[month] / maxVal) * (height - margin.top - margin.bottom);
      const y = height - margin.bottom - barHeight;
      
      svg += `<rect x="${x}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="#3498db" stroke="#2980b9"/>`;
      svg += `<text x="${x + barWidth * 0.4}" y="${height - margin.bottom + 20}" text-anchor="middle" font-size="10">${months[month - 1]}</text>`;
    });
    
    svg += '</svg>';
    
    const filename = 'bar_monthly_sales.svg';
    fs.writeFileSync(filename, svg);
    
    console.log(`✅ Bar chart saved as: ${filename}`);
    console.log(`📊 Shows monthly averages for ${Object.keys(monthlyAvgs).length} months`);
  }

  createSVGHeader(width, height, title) {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="${width/2}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#2c3e50">${title}</text>
  `;
  }

  createAxes(margin, plotWidth, plotHeight, xMin, xMax, yMin, yMax, xLabel, yLabel) {
    let axes = `
  <!-- X axis -->
  <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#bdc3c7" stroke-width="1"/>
  <!-- Y axis -->
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#bdc3c7" stroke-width="1"/>
  `;
    
    // Add labels
    axes += `<text x="${margin.left + plotWidth/2}" y="${margin.top + plotHeight + 40}" text-anchor="middle" font-size="14" fill="#34495e">${xLabel}</text>`;
    axes += `<text x="${margin.left - 50}" y="${margin.top + plotHeight/2}" text-anchor="middle" font-size="14" fill="#34495e" transform="rotate(-90 ${margin.left - 50} ${margin.top + plotHeight/2})">${yLabel}</text>`;
    
    return axes;
  }

  // Helper functions
  calculateTrend(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
    const sumX2 = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  getCorrelationStrength(corr) {
    const abs = Math.abs(corr);
    if (abs >= 0.9) return 'Very Strong';
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.5) return 'Moderate';
    if (abs >= 0.3) return 'Weak';
    return 'Very Weak';
  }

  getCorrelationBar(corr) {
    const abs = Math.abs(corr);
    const barLength = Math.round(abs * 10);
    const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
    return `[${bar}]`;
  }
}

// Start the demo
const demo = new InteractiveQueryDemo();
demo.start().catch(console.error);