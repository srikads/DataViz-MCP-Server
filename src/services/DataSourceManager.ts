import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { DataPoint, DataSource, DataSourceConnection } from '../types/index.js';

export class DataSourceManager {
  private connections: Map<string, DataSourceConnection> = new Map();

  async connectToSource(id: string, source: DataSource): Promise<DataSourceConnection> {
    const connection: DataSourceConnection = {
      id,
      source,
      status: 'connected',
      lastUpdated: Date.now()
    };

    try {
      // Validate connection based on source type
      await this.validateConnection(source);
      this.connections.set(id, connection);
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

    switch (connection.source.type) {
      case 'csv':
        return this.loadCSV(connection.source.config.filePath);
      case 'json':
        return this.loadJSON(connection.source.config.filePath);
      case 'excel':
        return this.loadExcel(connection.source.config.filePath, connection.source.config.sheetName);
      default:
        throw new Error(`Unsupported data source type: ${connection.source.type}`);
    }
  }

  private async validateConnection(source: DataSource): Promise<void> {
    switch (source.type) {
      case 'csv':
      case 'json':
      case 'excel':
        if (!source.config.filePath || !fs.existsSync(source.config.filePath)) {
          throw new Error('File path does not exist');
        }
        break;
      default:
        throw new Error(`Validation not implemented for source type: ${source.type}`);
    }
  }

  private async loadCSV(filePath: string): Promise<DataPoint[]> {
    return new Promise((resolve, reject) => {
      const results: DataPoint[] = [];
      let rowIndex = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          const dataPoint: DataPoint = {
            id: `csv_${rowIndex++}`,
            timestamp: Date.now(),
            values: this.sanitizeValues(data),
            metadata: { source: 'csv', filePath }
          };
          results.push(dataPoint);
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  private async loadJSON(filePath: string): Promise<DataPoint[]> {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error('JSON file must contain an array of objects');
    }

    return data.map((item, index) => ({
      id: `json_${index}`,
      timestamp: Date.now(),
      values: this.sanitizeValues(item),
      metadata: { source: 'json', filePath }
    }));
  }

  private async loadExcel(filePath: string, sheetName?: string): Promise<DataPoint[]> {
    const workbook = XLSX.readFile(filePath);
    const sheet = sheetName ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]];
    
    if (!sheet) {
      throw new Error(`Sheet ${sheetName || workbook.SheetNames[0]} not found`);
    }

    const data = XLSX.utils.sheet_to_json(sheet);
    
    return data.map((item, index) => ({
      id: `excel_${index}`,
      timestamp: Date.now(),
      values: this.sanitizeValues(item as Record<string, any>),
      metadata: { source: 'excel', filePath, sheetName }
    }));
  }

  private sanitizeValues(data: Record<string, any>): Record<string, number | string | boolean> {
    const sanitized: Record<string, number | string | boolean> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value !== null && value !== undefined) {
        sanitized[key] = String(value);
      }
    }
    
    return sanitized;
  }

  getConnections(): DataSourceConnection[] {
    return Array.from(this.connections.values());
  }

  getConnection(id: string): DataSourceConnection | undefined {
    return this.connections.get(id);
  }

  removeConnection(id: string): boolean {
    return this.connections.delete(id);
  }
}