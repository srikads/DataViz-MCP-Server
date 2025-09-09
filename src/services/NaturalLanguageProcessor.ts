import { DataPoint, DataPattern, VisualizationConfig } from '../types/index.js';
import { AIAnalyzer } from './AIAnalyzer.js';
import { PatternFingerprintGenerator } from './PatternFingerprint.js';

interface QueryIntent {
  type: 'pattern_analysis' | 'visualization' | 'comparison' | 'anomaly_detection' | 'statistical_summary' | 'correlation_analysis';
  confidence: number;
  parameters: Record<string, any>;
  columns: string[];
  filters: QueryFilter[];
  timeRange?: { start?: string; end?: string };
}

interface QueryFilter {
  column: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
  value: string | number | [number, number];
}

interface NLQueryResult {
  query: string;
  intent: QueryIntent;
  answer: string;
  visualizations?: VisualizationConfig[];
  data_insights: string[];
  confidence: number;
  suggested_followup_questions: string[];
}

export class NaturalLanguageProcessor {
  private aiAnalyzer: AIAnalyzer;
  private fingerprintGenerator: PatternFingerprintGenerator;
  
  // Pattern matching keywords for intent detection
  private readonly intentPatterns = {
    pattern_analysis: [
      'pattern', 'trend', 'seasonal', 'cyclical', 'recurring', 'periodic',
      'behavior', 'tendency', 'rhythm', 'cycle'
    ],
    visualization: [
      'show', 'plot', 'chart', 'graph', 'visualize', 'display', 'draw',
      'create chart', 'make graph', 'generate plot'
    ],
    comparison: [
      'compare', 'versus', 'vs', 'difference', 'between', 'contrast',
      'similarity', 'alike', 'different', 'relation'
    ],
    anomaly_detection: [
      'anomaly', 'anomalies', 'outlier', 'outliers', 'unusual', 'strange',
      'abnormal', 'deviation', 'exception', 'irregular'
    ],
    statistical_summary: [
      'summary', 'statistics', 'stats', 'average', 'mean', 'median',
      'distribution', 'describe', 'overview'
    ],
    correlation_analysis: [
      'correlation', 'correlate', 'relationship', 'connection', 'related',
      'associated', 'linked', 'influence', 'affect'
    ]
  };

  private readonly timeKeywords = [
    'yesterday', 'today', 'tomorrow', 'week', 'month', 'year', 'day',
    'last', 'past', 'recent', 'latest', 'since', 'until', 'before', 'after'
  ];

  private readonly aggregationKeywords = {
    'sum': ['total', 'sum', 'aggregate', 'combined'],
    'average': ['average', 'mean', 'avg'],
    'maximum': ['max', 'maximum', 'highest', 'peak', 'top'],
    'minimum': ['min', 'minimum', 'lowest', 'bottom'],
    'count': ['count', 'number of', 'how many']
  };

  constructor() {
    this.aiAnalyzer = new AIAnalyzer();
    this.fingerprintGenerator = new PatternFingerprintGenerator();
  }

  async processQuery(
    query: string, 
    data: DataPoint[], 
    availableColumns: string[]
  ): Promise<NLQueryResult> {
    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();
    
    // Extract intent
    const intent = this.extractIntent(normalizedQuery, availableColumns);
    
    // Process based on intent
    let answer: string;
    let visualizations: VisualizationConfig[] = [];
    let data_insights: string[] = [];
    
    switch (intent.type) {
      case 'pattern_analysis':
        ({ answer, visualizations, data_insights } = await this.handlePatternAnalysis(
          normalizedQuery, data, intent
        ));
        break;
      case 'visualization':
        ({ answer, visualizations, data_insights } = await this.handleVisualization(
          normalizedQuery, data, intent
        ));
        break;
      case 'comparison':
        ({ answer, visualizations, data_insights } = await this.handleComparison(
          normalizedQuery, data, intent
        ));
        break;
      case 'anomaly_detection':
        ({ answer, visualizations, data_insights } = await this.handleAnomalyDetection(
          normalizedQuery, data, intent
        ));
        break;
      case 'statistical_summary':
        ({ answer, visualizations, data_insights } = await this.handleStatisticalSummary(
          normalizedQuery, data, intent
        ));
        break;
      case 'correlation_analysis':
        ({ answer, visualizations, data_insights } = await this.handleCorrelationAnalysis(
          normalizedQuery, data, intent
        ));
        break;
      default:
        answer = "I'm not sure how to help with that. Try asking about patterns, correlations, anomalies, or visualizations in your data.";
    }

    const suggested_followup_questions = this.generateFollowupQuestions(intent, availableColumns);

    return {
      query,
      intent,
      answer,
      visualizations,
      data_insights,
      confidence: intent.confidence,
      suggested_followup_questions
    };
  }

  private extractIntent(query: string, availableColumns: string[]): QueryIntent {
    const words = query.split(/\s+/);
    const intentScores: Record<string, number> = {};
    
    // Calculate scores for each intent type
    for (const [intentType, keywords] of Object.entries(this.intentPatterns)) {
      let score = 0;
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          score += keyword.length; // Longer keywords get higher weight
        }
      }
      intentScores[intentType] = score;
    }
    
    // Find the highest scoring intent
    const bestIntent = Object.entries(intentScores).reduce((a, b) => 
      intentScores[a[0]] > intentScores[b[0]] ? a : b
    );
    
    const confidence = Math.min(1, bestIntent[1] / 10); // Normalize confidence
    
    // Extract columns mentioned in query
    const mentionedColumns = availableColumns.filter(col => 
      query.includes(col.toLowerCase()) || 
      query.includes(col.toLowerCase().replace(/[_\s]/g, ''))
    );
    
    // Extract filters
    const filters = this.extractFilters(query, availableColumns);
    
    // Extract time range
    const timeRange = this.extractTimeRange(query);
    
    // Extract parameters based on intent
    const parameters = this.extractParameters(query, bestIntent[0]);

    return {
      type: bestIntent[0] as QueryIntent['type'],
      confidence: Math.max(0.3, confidence), // Minimum confidence
      parameters,
      columns: mentionedColumns,
      filters,
      timeRange
    };
  }

  private extractFilters(query: string, availableColumns: string[]): QueryFilter[] {
    const filters: QueryFilter[] = [];
    
    // Look for comparison patterns like "where X > 100" or "sales greater than 1000"
    const comparisonPatterns = [
      { pattern: /(\w+)\s*(>|greater than|above)\s*(\d+(?:\.\d+)?)/gi, operator: 'greater_than' as const },
      { pattern: /(\w+)\s*(<|less than|below)\s*(\d+(?:\.\d+)?)/gi, operator: 'less_than' as const },
      { pattern: /(\w+)\s*(=|equals?|is)\s*["']?([^"'\s]+)["']?/gi, operator: 'equals' as const },
      { pattern: /(\w+)\s*contains?\s*["']?([^"'\s]+)["']?/gi, operator: 'contains' as const },
      { pattern: /(\w+)\s*between\s*(\d+(?:\.\d+)?)\s*and\s*(\d+(?:\.\d+)?)/gi, operator: 'between' as const }
    ];

    for (const { pattern, operator } of comparisonPatterns) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        const columnName = match[1];
        const matchedColumn = availableColumns.find(col => 
          col.toLowerCase().includes(columnName.toLowerCase()) ||
          columnName.toLowerCase().includes(col.toLowerCase())
        );
        
        if (matchedColumn) {
          let value: string | number | [number, number];
          
          if (operator === 'between') {
            value = [parseFloat(match[2]), parseFloat(match[3])];
          } else if (operator === 'greater_than' || operator === 'less_than') {
            value = parseFloat(match[3]);
          } else {
            value = match[2] || match[3];
            // Try to convert to number if possible
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) value = numValue;
          }
          
          filters.push({
            column: matchedColumn,
            operator,
            value
          });
        }
      }
    }

    return filters;
  }

  private extractTimeRange(query: string): { start?: string; end?: string } | undefined {
    const timeRange: { start?: string; end?: string } = {};
    
    // Look for time-related patterns
    const timePatterns = [
      { pattern: /last\s+(\d+)\s+(day|week|month|year)s?/i, type: 'relative' },
      { pattern: /past\s+(\d+)\s+(day|week|month|year)s?/i, type: 'relative' },
      { pattern: /since\s+([\d\-\/]+)/i, type: 'absolute_start' },
      { pattern: /until\s+([\d\-\/]+)/i, type: 'absolute_end' },
      { pattern: /(yesterday|today|last week|last month|last year)/i, type: 'named' }
    ];

    for (const { pattern, type } of timePatterns) {
      const match = pattern.exec(query);
      if (match) {
        switch (type) {
          case 'relative':
            const amount = parseInt(match[1]);
            const unit = match[2];
            const now = new Date();
            const startDate = new Date(now);
            
            switch (unit.toLowerCase()) {
              case 'day':
                startDate.setDate(now.getDate() - amount);
                break;
              case 'week':
                startDate.setDate(now.getDate() - (amount * 7));
                break;
              case 'month':
                startDate.setMonth(now.getMonth() - amount);
                break;
              case 'year':
                startDate.setFullYear(now.getFullYear() - amount);
                break;
            }
            
            timeRange.start = startDate.toISOString().split('T')[0];
            timeRange.end = now.toISOString().split('T')[0];
            break;
            
          case 'absolute_start':
            timeRange.start = match[1];
            break;
            
          case 'absolute_end':
            timeRange.end = match[1];
            break;
            
          case 'named':
            const named = match[1].toLowerCase();
            const today = new Date();
            
            switch (named) {
              case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                timeRange.start = timeRange.end = yesterday.toISOString().split('T')[0];
                break;
              case 'today':
                timeRange.start = timeRange.end = today.toISOString().split('T')[0];
                break;
              case 'last week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - 7);
                timeRange.start = weekStart.toISOString().split('T')[0];
                timeRange.end = today.toISOString().split('T')[0];
                break;
              case 'last month':
                const monthStart = new Date(today);
                monthStart.setMonth(today.getMonth() - 1);
                timeRange.start = monthStart.toISOString().split('T')[0];
                timeRange.end = today.toISOString().split('T')[0];
                break;
              case 'last year':
                const yearStart = new Date(today);
                yearStart.setFullYear(today.getFullYear() - 1);
                timeRange.start = yearStart.toISOString().split('T')[0];
                timeRange.end = today.toISOString().split('T')[0];
                break;
            }
            break;
        }
        break;
      }
    }

    return Object.keys(timeRange).length > 0 ? timeRange : undefined;
  }

  private extractParameters(query: string, intentType: string): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    // Extract aggregation functions
    for (const [func, keywords] of Object.entries(this.aggregationKeywords)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        parameters.aggregation = func;
        break;
      }
    }
    
    // Extract visualization type if applicable
    if (intentType === 'visualization') {
      const vizTypes = ['line', 'bar', 'scatter', 'histogram', 'pie', 'heatmap', 'box'];
      for (const type of vizTypes) {
        if (query.includes(type)) {
          parameters.visualization_type = type;
          break;
        }
      }
      
      // Look for chart-specific keywords
      if (query.includes('time series') || query.includes('over time')) {
        parameters.visualization_type = 'line';
      } else if (query.includes('distribution')) {
        parameters.visualization_type = 'histogram';
      } else if (query.includes('comparison') || query.includes('compare')) {
        parameters.visualization_type = 'bar';
      }
    }
    
    return parameters;
  }

  private async handlePatternAnalysis(
    query: string, 
    data: DataPoint[], 
    intent: QueryIntent
  ): Promise<{ answer: string; visualizations: VisualizationConfig[]; data_insights: string[] }> {
    const analysis = await this.aiAnalyzer.analyzeData(data);
    const patterns = analysis.patterns;
    
    let answer = "Here's what I found in your data patterns:\n\n";
    const visualizations: VisualizationConfig[] = [];
    const data_insights: string[] = [];

    // Filter patterns based on query specifics
    const relevantPatterns = patterns.filter(pattern => {
      if (query.includes('seasonal') || query.includes('season')) {
        return pattern.type === 'seasonal';
      } else if (query.includes('trend')) {
        return pattern.type === 'trend';
      } else if (query.includes('correlation')) {
        return pattern.type === 'correlation';
      }
      return true; // Include all patterns if no specific type mentioned
    });

    if (relevantPatterns.length === 0) {
      answer = "I didn't find any significant patterns in your data based on your query.";
      return { answer, visualizations, data_insights };
    }

    for (const pattern of relevantPatterns.slice(0, 3)) { // Top 3 patterns
      answer += `• **${pattern.type.toUpperCase()}**: ${pattern.description} (${(pattern.confidence * 100).toFixed(1)}% confidence)\n`;
      
      data_insights.push(pattern.description);
      
      // Generate appropriate visualization
      if (pattern.type === 'trend' || pattern.type === 'seasonal') {
        visualizations.push({
          type: 'line',
          data,
          yAxis: pattern.affectedColumns[0],
          title: `${pattern.type} Pattern: ${pattern.affectedColumns[0]}`
        });
      } else if (pattern.type === 'correlation') {
        visualizations.push({
          type: 'scatter',
          data,
          xAxis: pattern.affectedColumns[0],
          yAxis: pattern.affectedColumns[1],
          title: `Correlation: ${pattern.affectedColumns.join(' vs ')}`
        });
      }
    }

    answer += `\n${analysis.recommendations.slice(0, 2).map(rec => `💡 ${rec}`).join('\n')}`;

    return { answer, visualizations, data_insights };
  }

  private async handleVisualization(
    query: string, 
    data: DataPoint[], 
    intent: QueryIntent
  ): Promise<{ answer: string; visualizations: VisualizationConfig[]; data_insights: string[] }> {
    const vizType = intent.parameters.visualization_type || 'line';
    const columns = intent.columns;
    
    if (columns.length === 0) {
      return {
        answer: "I need you to specify which columns to visualize. Available columns: " + 
                Object.keys(data[0]?.values || {}).join(', '),
        visualizations: [],
        data_insights: []
      };
    }

    const visualization: VisualizationConfig = {
      type: vizType as any,
      data,
      xAxis: columns[0],
      yAxis: columns[1] || columns[0],
      title: query.charAt(0).toUpperCase() + query.slice(1)
    };

    // Apply filters if any
    if (intent.filters.length > 0) {
      visualization.data = this.applyFilters(data, intent.filters);
    }

    const answer = `Created a ${vizType} chart showing ${columns.join(' and ')}${intent.filters.length > 0 ? ' with your specified filters' : ''}.`;
    
    return {
      answer,
      visualizations: [visualization],
      data_insights: [`Visualizing ${columns.join(' and ')} using ${vizType} chart`]
    };
  }

  private async handleComparison(
    query: string, 
    data: DataPoint[], 
    intent: QueryIntent
  ): Promise<{ answer: string; visualizations: VisualizationConfig[]; data_insights: string[] }> {
    const columns = intent.columns;
    
    if (columns.length < 2) {
      return {
        answer: "I need at least two columns to compare. Please specify which data points you'd like to compare.",
        visualizations: [],
        data_insights: []
      };
    }

    const analysis = await this.aiAnalyzer.analyzeData(data);
    const stats = analysis.statistics;
    
    let answer = `Comparison between ${columns.join(' and ')}:\n\n`;
    
    for (const column of columns) {
      if (stats.mean[column] !== undefined) {
        answer += `• **${column}**: Mean = ${stats.mean[column].toFixed(2)}, `;
        answer += `Std Dev = ${stats.stdDev[column].toFixed(2)}\n`;
      }
    }

    // Check for correlations between compared columns
    const correlations: string[] = [];
    for (let i = 0; i < columns.length; i++) {
      for (let j = i + 1; j < columns.length; j++) {
        const corr = stats.correlations[columns[i]]?.[columns[j]];
        if (corr !== undefined) {
          correlations.push(`${columns[i]} and ${columns[j]}: ${(corr * 100).toFixed(1)}% correlation`);
        }
      }
    }

    if (correlations.length > 0) {
      answer += '\nCorrelations:\n' + correlations.map(c => `• ${c}`).join('\n');
    }

    const visualizations: VisualizationConfig[] = [
      {
        type: 'scatter',
        data,
        xAxis: columns[0],
        yAxis: columns[1],
        title: `${columns[0]} vs ${columns[1]}`
      }
    ];

    return {
      answer,
      visualizations,
      data_insights: correlations
    };
  }

  private async handleAnomalyDetection(
    query: string, 
    data: DataPoint[], 
    intent: QueryIntent
  ): Promise<{ answer: string; visualizations: VisualizationConfig[]; data_insights: string[] }> {
    const analysis = await this.aiAnalyzer.analyzeData(data);
    const anomalyPatterns = analysis.patterns.filter(p => p.type === 'anomaly');
    
    if (anomalyPatterns.length === 0) {
      return {
        answer: "No significant anomalies detected in your data.",
        visualizations: [],
        data_insights: []
      };
    }

    let answer = "Found these anomalies in your data:\n\n";
    const visualizations: VisualizationConfig[] = [];
    const data_insights: string[] = [];

    for (const anomaly of anomalyPatterns) {
      answer += `• **${anomaly.affectedColumns[0]}**: ${anomaly.description}\n`;
      data_insights.push(anomaly.description);
      
      // Create visualization highlighting anomalies
      visualizations.push({
        type: 'scatter',
        data,
        yAxis: anomaly.affectedColumns[0],
        title: `Anomalies in ${anomaly.affectedColumns[0]}`
      });
    }

    return { answer, visualizations, data_insights };
  }

  private async handleStatisticalSummary(
    query: string, 
    data: DataPoint[], 
    intent: QueryIntent
  ): Promise<{ answer: string; visualizations: VisualizationConfig[]; data_insights: string[] }> {
    const analysis = await this.aiAnalyzer.analyzeData(data);
    const stats = analysis.statistics;
    
    let answer = "Statistical Summary:\n\n";
    const data_insights: string[] = [];
    
    const targetColumns = intent.columns.length > 0 ? intent.columns : Object.keys(stats.mean);
    
    for (const column of targetColumns.slice(0, 5)) { // Limit to 5 columns
      if (stats.mean[column] !== undefined) {
        answer += `**${column}:**\n`;
        answer += `  • Mean: ${stats.mean[column].toFixed(2)}\n`;
        answer += `  • Median: ${stats.median[column].toFixed(2)}\n`;
        answer += `  • Std Dev: ${stats.stdDev[column].toFixed(2)}\n\n`;
        
        data_insights.push(`${column}: Mean=${stats.mean[column].toFixed(2)}, StdDev=${stats.stdDev[column].toFixed(2)}`);
      }
    }

    answer += `Total data points: ${data.length}`;

    const visualizations: VisualizationConfig[] = [];
    if (targetColumns.length > 0) {
      visualizations.push({
        type: 'histogram',
        data,
        xAxis: targetColumns[0],
        title: `Distribution of ${targetColumns[0]}`
      });
    }

    return { answer, visualizations, data_insights };
  }

  private async handleCorrelationAnalysis(
    query: string, 
    data: DataPoint[], 
    intent: QueryIntent
  ): Promise<{ answer: string; visualizations: VisualizationConfig[]; data_insights: string[] }> {
    const analysis = await this.aiAnalyzer.analyzeData(data);
    const correlationPatterns = analysis.patterns.filter(p => p.type === 'correlation');
    
    let answer = "Correlation Analysis:\n\n";
    const visualizations: VisualizationConfig[] = [];
    const data_insights: string[] = [];

    if (correlationPatterns.length === 0) {
      answer = "No significant correlations found in your data.";
      return { answer, visualizations, data_insights };
    }

    for (const corr of correlationPatterns.slice(0, 3)) { // Top 3 correlations
      answer += `• ${corr.description}\n`;
      data_insights.push(corr.description);
      
      if (corr.affectedColumns.length === 2) {
        visualizations.push({
          type: 'scatter',
          data,
          xAxis: corr.affectedColumns[0],
          yAxis: corr.affectedColumns[1],
          title: `Correlation: ${corr.affectedColumns.join(' vs ')}`
        });
      }
    }

    // Add correlation heatmap if multiple columns
    const numericColumns = Object.keys(analysis.statistics.mean);
    if (numericColumns.length > 2) {
      visualizations.push({
        type: 'heatmap',
        data,
        title: 'Correlation Matrix'
      });
    }

    return { answer, visualizations, data_insights };
  }

  private applyFilters(data: DataPoint[], filters: QueryFilter[]): DataPoint[] {
    return data.filter(point => {
      return filters.every(filter => {
        const value = point.values[filter.column];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'greater_than':
            return typeof value === 'number' && value > (filter.value as number);
          case 'less_than':
            return typeof value === 'number' && value < (filter.value as number);
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'between':
            const range = filter.value as [number, number];
            return typeof value === 'number' && value >= range[0] && value <= range[1];
          default:
            return true;
        }
      });
    });
  }

  private generateFollowupQuestions(intent: QueryIntent, availableColumns: string[]): string[] {
    const questions: string[] = [];
    
    switch (intent.type) {
      case 'pattern_analysis':
        questions.push("What causes these patterns?");
        questions.push("How do these patterns compare to previous periods?");
        questions.push("Are there any seasonal effects I should consider?");
        break;
        
      case 'visualization':
        questions.push("Can you show this data grouped by another variable?");
        questions.push("What does the distribution look like?");
        questions.push("How does this compare to other time periods?");
        break;
        
      case 'anomaly_detection':
        questions.push("What might be causing these anomalies?");
        questions.push("Are these anomalies increasing over time?");
        questions.push("How do I prevent similar anomalies?");
        break;
        
      case 'correlation_analysis':
        questions.push("Is this correlation causation?");
        questions.push("How strong is this relationship?");
        questions.push("Are there other factors that might influence this?");
        break;
        
      case 'statistical_summary':
        questions.push("How does this compare to industry benchmarks?");
        questions.push("What's the trend over time?");
        questions.push("Are there any concerning patterns?");
        break;
        
      case 'comparison':
        questions.push("What factors drive the differences?");
        questions.push("Is one consistently better than the other?");
        questions.push("How can I improve the lower-performing option?");
        break;
    }

    // Add column-specific questions
    if (availableColumns.length > 0) {
      const randomColumns = availableColumns.slice(0, 2);
      questions.push(`How does ${randomColumns[0]} relate to the overall trends?`);
      if (randomColumns.length > 1) {
        questions.push(`Show me the correlation between ${randomColumns[0]} and ${randomColumns[1]}`);
      }
    }

    return questions.slice(0, 4); // Return top 4 questions
  }

  // Helper method to get example queries for users
  getExampleQueries(availableColumns: string[] = []): string[] {
    const examples = [
      "What are the seasonal trends in the data?",
      "Show me correlations between all variables",
      "Find anomalies in the last 6 months",
      "Compare the patterns between different categories",
      "What's the statistical summary of the dataset?",
      "Visualize the distribution of values",
      "Are there any unusual patterns I should know about?",
      "How do the variables relate to each other?",
      "Show me a time series plot",
      "What are the key insights from this data?"
    ];

    // Add column-specific examples if columns are available
    if (availableColumns.length > 0) {
      const col1 = availableColumns[0];
      const col2 = availableColumns[1] || availableColumns[0];
      
      examples.unshift(
        `What's the trend in ${col1} over time?`,
        `Show me the correlation between ${col1} and ${col2}`,
        `Find anomalies in ${col1}`,
        `What's the average ${col1} by category?`
      );
    }

    return examples;
  }
}