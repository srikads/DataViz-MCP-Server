import fs from 'fs';
import path from 'path';
import { DataPoint, DataSource, DataSourceConnection } from '../types/index.js';
import { DataSourceManager } from './DataSourceManager.js';

// Extend DataSource type for new formats
interface ExtendedDataSource extends DataSource {
  type: 'csv' | 'json' | 'excel' | 'sql' | 'api' | 'websocket' | 'image' | 'kafka';
  config: {
    filePath?: string;
    connectionString?: string;
    apiUrl?: string;
    apiKey?: string;
    headers?: Record<string, string>;
    query?: string;
    tableName?: string;
    websocketUrl?: string;
    kafkaTopic?: string;
    kafkaBrokers?: string[];
    imageUrl?: string;
    imageType?: 'chart' | 'graph' | 'table';
    sheetName?: string;
    delimiter?: string;
    [key: string]: any;
  };
}

interface StreamingConnection {
  id: string;
  type: 'websocket' | 'kafka';
  connection: any; // WebSocket or Kafka consumer
  isActive: boolean;
  onData: (data: DataPoint[]) => void;
}

export class AdvancedDataSourceManager extends DataSourceManager {
  private streamingConnections: Map<string, StreamingConnection> = new Map();
  private apiCache: Map<string, { data: DataPoint[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async connectToSource(id: string, source: ExtendedDataSource): Promise<DataSourceConnection> {
    const connection: DataSourceConnection = {
      id,
      source,
      status: 'connected',
      lastUpdated: Date.now()
    };

    try {
      await this.validateConnection(source);
      this.connections.set(id, connection);
      
      // Set up streaming if applicable
      if (source.type === 'websocket' || source.type === 'kafka') {
        await this.setupStreamingConnection(id, source);
      }
      
      return connection;
    } catch (error) {
      connection.status = 'error';
      this.connections.set(id, connection);
      throw new Error(`Failed to connect to data source: ${error}`);
    }
  }

  async loadData(connectionId: string): Promise<DataPoint[]> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const source = connection.source as ExtendedDataSource;

    switch (source.type) {
      case 'csv':
      case 'json':
      case 'excel':
        return super.loadData(connectionId);
        
      case 'sql':
        return this.loadFromSQL(source);
        
      case 'api':
        return this.loadFromAPI(source);
        
      case 'websocket':
        return this.loadFromWebSocket(connectionId);
        
      case 'kafka':
        return this.loadFromKafka(connectionId);
        
      case 'image':
        return this.loadFromImage(source);
        
      default:
        throw new Error(`Unsupported data source type: ${source.type}`);
    }
  }

  private async validateConnection(source: ExtendedDataSource): Promise<void> {
    switch (source.type) {
      case 'csv':
      case 'json':
      case 'excel':
        await super['validateConnection'](source);
        break;
        
      case 'sql':
        if (!source.config.connectionString) {
          throw new Error('Connection string required for SQL sources');
        }
        await this.testSQLConnection(source);
        break;
        
      case 'api':
        if (!source.config.apiUrl) {
          throw new Error('API URL required for API sources');
        }
        await this.testAPIConnection(source);
        break;
        
      case 'websocket':
        if (!source.config.websocketUrl) {
          throw new Error('WebSocket URL required');
        }
        break;
        
      case 'kafka':
        if (!source.config.kafkaBrokers || !source.config.kafkaTopic) {
          throw new Error('Kafka brokers and topic required');
        }
        break;
        
      case 'image':
        if (!source.config.imageUrl && !source.config.filePath) {
          throw new Error('Image URL or file path required');
        }
        break;
        
      default:
        throw new Error(`Validation not implemented for source type: ${source.type}`);
    }
  }

  private async loadFromSQL(source: ExtendedDataSource): Promise<DataPoint[]> {
    // This is a placeholder - in a real implementation, you would use appropriate SQL drivers
    // For now, we'll simulate SQL loading
    
    const { connectionString, query, tableName } = source.config;
    
    // Simulate database connection and query execution
    console.log(`Connecting to database: ${connectionString}`);
    console.log(`Executing query: ${query || `SELECT * FROM ${tableName}`}`);
    
    // In real implementation:
    // - Use pg for PostgreSQL, mysql2 for MySQL, sqlite3 for SQLite
    // - Execute the query and transform results to DataPoint format
    
    // Simulated data for now
    const simulatedData: DataPoint[] = [];
    for (let i = 0; i < 100; i++) {
      simulatedData.push({
        id: `sql_${i}`,
        timestamp: Date.now() - (i * 60000), // One minute intervals
        values: {
          id: i,
          value: Math.random() * 100,
          category: ['A', 'B', 'C'][i % 3],
          date: new Date(Date.now() - (i * 60000)).toISOString()
        },
        metadata: { source: 'sql', table: tableName }
      });
    }
    
    return simulatedData;
  }

  private async loadFromAPI(source: ExtendedDataSource): Promise<DataPoint[]> {
    const { apiUrl, apiKey, headers = {}, query } = source.config;
    
    // Check cache first
    const cacheKey = `${apiUrl}_${JSON.stringify(query)}`;
    const cached = this.apiCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const requestHeaders: Record<string, string> = { ...headers };
      
      if (apiKey) {
        requestHeaders['Authorization'] = `Bearer ${apiKey}`;
      }
      
      let url = apiUrl;
      if (query) {
        const params = new URLSearchParams(query);
        url += `?${params.toString()}`;
      }

      // In a real implementation, you would use fetch or axios
      // For now, simulate API response
      console.log(`Fetching data from API: ${url}`);
      
      // Simulated API data
      const simulatedData: DataPoint[] = [];
      for (let i = 0; i < 50; i++) {
        simulatedData.push({
          id: `api_${i}`,
          timestamp: Date.now(),
          values: {
            timestamp: Date.now() - (i * 300000), // 5-minute intervals
            metric: Math.random() * 1000,
            status: ['active', 'inactive'][i % 2],
            region: ['us-east', 'us-west', 'eu-central'][i % 3]
          },
          metadata: { source: 'api', endpoint: apiUrl }
        });
      }
      
      // Cache the result
      this.apiCache.set(cacheKey, {
        data: simulatedData,
        timestamp: Date.now()
      });
      
      return simulatedData;
    } catch (error) {
      throw new Error(`API request failed: ${error}`);
    }
  }

  private async setupStreamingConnection(id: string, source: ExtendedDataSource): Promise<void> {
    if (source.type === 'websocket') {
      await this.setupWebSocketConnection(id, source);
    } else if (source.type === 'kafka') {
      await this.setupKafkaConnection(id, source);
    }
  }

  private async setupWebSocketConnection(id: string, source: ExtendedDataSource): Promise<void> {
    // In a real implementation, you would use the 'ws' library
    // For now, simulate WebSocket connection
    
    console.log(`Setting up WebSocket connection to: ${source.config.websocketUrl}`);
    
    const mockWebSocket = {
      readyState: 1, // OPEN
      onmessage: null,
      onerror: null,
      onclose: null,
      close: () => console.log('WebSocket closed')
    };

    const streamingConnection: StreamingConnection = {
      id,
      type: 'websocket',
      connection: mockWebSocket,
      isActive: true,
      onData: (data: DataPoint[]) => {
        // Handle incoming streaming data
        console.log(`Received ${data.length} data points from WebSocket`);
      }
    };

    this.streamingConnections.set(id, streamingConnection);

    // Simulate periodic data reception
    const interval = setInterval(() => {
      if (streamingConnection.isActive) {
        const newData: DataPoint[] = [{
          id: `ws_${Date.now()}`,
          timestamp: Date.now(),
          values: {
            value: Math.random() * 100,
            timestamp: Date.now()
          },
          metadata: { source: 'websocket' }
        }];
        
        streamingConnection.onData(newData);
      } else {
        clearInterval(interval);
      }
    }, 5000); // Every 5 seconds
  }

  private async setupKafkaConnection(id: string, source: ExtendedDataSource): Promise<void> {
    // In a real implementation, you would use 'kafkajs' library
    // For now, simulate Kafka connection
    
    const { kafkaBrokers, kafkaTopic } = source.config;
    
    console.log(`Setting up Kafka connection to brokers: ${kafkaBrokers?.join(', ')}`);
    console.log(`Subscribing to topic: ${kafkaTopic}`);

    const mockKafkaConsumer = {
      subscribe: () => Promise.resolve(),
      run: () => Promise.resolve(),
      disconnect: () => Promise.resolve()
    };

    const streamingConnection: StreamingConnection = {
      id,
      type: 'kafka',
      connection: mockKafkaConsumer,
      isActive: true,
      onData: (data: DataPoint[]) => {
        console.log(`Received ${data.length} data points from Kafka`);
      }
    };

    this.streamingConnections.set(id, streamingConnection);

    // Simulate message consumption
    const interval = setInterval(() => {
      if (streamingConnection.isActive) {
        const messages: DataPoint[] = [];
        
        // Simulate 1-3 messages at a time
        const messageCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < messageCount; i++) {
          messages.push({
            id: `kafka_${Date.now()}_${i}`,
            timestamp: Date.now(),
            values: {
              event: ['click', 'view', 'purchase'][Math.floor(Math.random() * 3)],
              user_id: Math.floor(Math.random() * 10000),
              value: Math.random() * 100,
              timestamp: Date.now()
            },
            metadata: { source: 'kafka', topic: kafkaTopic }
          });
        }
        
        streamingConnection.onData(messages);
      } else {
        clearInterval(interval);
      }
    }, 2000); // Every 2 seconds
  }

  private async loadFromWebSocket(connectionId: string): Promise<DataPoint[]> {
    const streamingConnection = this.streamingConnections.get(connectionId);
    
    if (!streamingConnection || streamingConnection.type !== 'websocket') {
      throw new Error('WebSocket connection not found or inactive');
    }

    // Return buffered data (in a real implementation, you'd maintain a buffer)
    return [{
      id: `ws_current_${Date.now()}`,
      timestamp: Date.now(),
      values: {
        status: 'connected',
        lastUpdate: Date.now()
      },
      metadata: { source: 'websocket', connectionId }
    }];
  }

  private async loadFromKafka(connectionId: string): Promise<DataPoint[]> {
    const streamingConnection = this.streamingConnections.get(connectionId);
    
    if (!streamingConnection || streamingConnection.type !== 'kafka') {
      throw new Error('Kafka connection not found or inactive');
    }

    // Return buffered data (in a real implementation, you'd maintain a buffer)
    return [{
      id: `kafka_current_${Date.now()}`,
      timestamp: Date.now(),
      values: {
        consumerStatus: 'active',
        lastMessage: Date.now(),
        messageCount: Math.floor(Math.random() * 1000)
      },
      metadata: { source: 'kafka', connectionId }
    }];
  }

  private async loadFromImage(source: ExtendedDataSource): Promise<DataPoint[]> {
    const { imageUrl, filePath, imageType = 'chart' } = source.config;
    
    // In a real implementation, you would:
    // 1. Load the image using canvas or sharp
    // 2. Use OCR libraries like Tesseract.js to extract text
    // 3. Use computer vision to detect chart elements
    // 4. Extract data points from the chart/graph
    
    console.log(`Processing image: ${imageUrl || filePath}`);
    console.log(`Image type: ${imageType}`);
    
    // Simulated image processing results
    const extractedData: DataPoint[] = [];
    
    // Simulate extracted data points from a chart
    for (let i = 0; i < 20; i++) {
      extractedData.push({
        id: `image_${i}`,
        timestamp: Date.now(),
        values: {
          x: i,
          y: Math.sin(i * 0.5) * 50 + 50 + (Math.random() * 10 - 5), // Simulated chart data
          category: imageType
        },
        metadata: {
          source: 'image',
          imageUrl: imageUrl || filePath,
          extractionMethod: 'ocr_cv',
          confidence: 0.8 + Math.random() * 0.2
        }
      });
    }
    
    return extractedData;
  }

  private async testSQLConnection(source: ExtendedDataSource): Promise<void> {
    // Simulate SQL connection test
    console.log(`Testing SQL connection: ${source.config.connectionString}`);
    
    // In a real implementation, you would:
    // 1. Parse the connection string
    // 2. Attempt to connect to the database
    // 3. Run a simple test query like SELECT 1
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Randomly simulate connection failures for testing
    if (Math.random() < 0.1) { // 10% failure rate for simulation
      throw new Error('Failed to connect to database');
    }
  }

  private async testAPIConnection(source: ExtendedDataSource): Promise<void> {
    // Simulate API connection test
    console.log(`Testing API connection: ${source.config.apiUrl}`);
    
    // In a real implementation, you would make a HEAD request or simple GET
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simulate occasional API failures
    if (Math.random() < 0.05) { // 5% failure rate for simulation
      throw new Error('API endpoint unreachable');
    }
  }

  // Streaming data management
  async stopStreamingConnection(connectionId: string): Promise<void> {
    const streamingConnection = this.streamingConnections.get(connectionId);
    
    if (streamingConnection) {
      streamingConnection.isActive = false;
      
      if (streamingConnection.type === 'websocket') {
        streamingConnection.connection.close();
      } else if (streamingConnection.type === 'kafka') {
        await streamingConnection.connection.disconnect();
      }
      
      this.streamingConnections.delete(connectionId);
    }
  }

  getStreamingConnections(): StreamingConnection[] {
    return Array.from(this.streamingConnections.values());
  }

  // Cache management
  clearAPICache(): void {
    this.apiCache.clear();
  }

  getAPICacheStats(): { entries: number; totalSize: number; oldestEntry: number } {
    const entries = this.apiCache.size;
    let totalSize = 0;
    let oldestEntry = Date.now();
    
    for (const [_, cached] of this.apiCache.entries()) {
      totalSize += cached.data.length;
      if (cached.timestamp < oldestEntry) {
        oldestEntry = cached.timestamp;
      }
    }
    
    return { entries, totalSize, oldestEntry };
  }

  // Cleanup expired cache entries
  cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.apiCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.apiCache.delete(key);
      }
    }
  }

  // Web scraping support (placeholder)
  private async loadFromWebScraping(source: ExtendedDataSource): Promise<DataPoint[]> {
    // In a real implementation, you would use libraries like:
    // - Puppeteer for dynamic content
    // - Cheerio for static HTML parsing
    // - Playwright for cross-browser scraping
    
    const { url, selectors, waitFor } = source.config;
    
    console.log(`Scraping data from: ${url}`);
    
    // Simulated scraped data
    return [{
      id: `scraped_${Date.now()}`,
      timestamp: Date.now(),
      values: {
        title: 'Sample scraped title',
        value: Math.random() * 100,
        url: url
      },
      metadata: { source: 'web_scraping', url }
    }];
  }

  // Real-time data processing
  setStreamingDataHandler(connectionId: string, handler: (data: DataPoint[]) => void): void {
    const connection = this.streamingConnections.get(connectionId);
    if (connection) {
      connection.onData = handler;
    }
  }

  // Batch processing for large datasets
  async loadDataInBatches(
    connectionId: string, 
    batchSize: number = 1000
  ): Promise<AsyncGenerator<DataPoint[], void, unknown>> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const source = connection.source as ExtendedDataSource;
    
    // For SQL sources, implement pagination
    if (source.type === 'sql') {
      return this.loadSQLInBatches(source, batchSize);
    }
    
    // For other sources, load all data and split into batches
    const allData = await this.loadData(connectionId);
    return this.splitIntoBatches(allData, batchSize);
  }

  private async* loadSQLInBatches(
    source: ExtendedDataSource, 
    batchSize: number
  ): AsyncGenerator<DataPoint[], void, unknown> {
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      // Modify query to include LIMIT and OFFSET
      const batchQuery = `${source.config.query} LIMIT ${batchSize} OFFSET ${offset}`;
      
      // In a real implementation, execute the paginated query
      console.log(`Executing batch query: ${batchQuery}`);
      
      // Simulated batch data
      const batchData: DataPoint[] = [];
      for (let i = 0; i < batchSize; i++) {
        batchData.push({
          id: `batch_${offset + i}`,
          timestamp: Date.now(),
          values: {
            id: offset + i,
            value: Math.random() * 100
          },
          metadata: { source: 'sql', batch: true }
        });
      }
      
      hasMore = batchData.length === batchSize;
      offset += batchSize;
      
      if (batchData.length > 0) {
        yield batchData;
      }
    }
  }

  private async* splitIntoBatches(
    data: DataPoint[], 
    batchSize: number
  ): AsyncGenerator<DataPoint[], void, unknown> {
    for (let i = 0; i < data.length; i += batchSize) {
      yield data.slice(i, i + batchSize);
    }
  }
}