import fs from 'fs';
import path from 'path';
import { DataSource, DataPoint } from '../types/index.js';
import { DataSourceManager } from './DataSourceManager.js';
import { AIAnalyzer } from './AIAnalyzer.js';

interface DiscoveredDataSource {
  path: string;
  type: 'csv' | 'json' | 'excel';
  size: number;
  lastModified: Date;
  columns: string[];
  rowCount: number;
  confidence: number;
  metadata: {
    hasHeaders: boolean;
    delimiter?: string;
    encoding?: string;
    sheetNames?: string[];
  };
}

interface DataSourceScan {
  directory: string;
  recursive: boolean;
  filePatterns: string[];
  maxFileSize: number;
  maxFiles: number;
}

export class AutoDiscoveryPipeline {
  private dataSourceManager: DataSourceManager;
  private aiAnalyzer: AIAnalyzer;
  private supportedExtensions = ['.csv', '.json', '.xlsx', '.xls'];

  constructor() {
    this.dataSourceManager = new DataSourceManager();
    this.aiAnalyzer = new AIAnalyzer();
  }

  async discoverDataSources(scanConfig: DataSourceScan): Promise<DiscoveredDataSource[]> {
    const discovered: DiscoveredDataSource[] = [];
    
    try {
      const files = await this.scanDirectory(
        scanConfig.directory, 
        scanConfig.recursive,
        scanConfig.maxFiles
      );

      for (const filePath of files) {
        if (discovered.length >= scanConfig.maxFiles) break;

        try {
          const stats = fs.statSync(filePath);
          if (stats.size > scanConfig.maxFileSize) continue;

          const ext = path.extname(filePath).toLowerCase();
          if (!this.supportedExtensions.includes(ext)) continue;

          const dataSource = await this.analyzeDataSource(filePath, stats);
          if (dataSource && dataSource.confidence > 0.5) {
            discovered.push(dataSource);
          }
        } catch (error) {
          // Skip files that can't be analyzed
          console.error(`Failed to analyze ${filePath}:`, error);
        }
      }
    } catch (error) {
      throw new Error(`Discovery failed: ${error}`);
    }

    return discovered.sort((a, b) => b.confidence - a.confidence);
  }

  async autoConnectBestSources(
    discovered: DiscoveredDataSource[], 
    maxConnections: number = 5
  ): Promise<string[]> {
    const connectionIds: string[] = [];
    const topSources = discovered.slice(0, maxConnections);

    for (const source of topSources) {
      try {
        const connectionId = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const dataSource: DataSource = {
          type: source.type,
          config: {
            filePath: source.path,
            ...(source.metadata.sheetNames && { sheetName: source.metadata.sheetNames[0] })
          }
        };

        await this.dataSourceManager.connectToSource(connectionId, dataSource);
        connectionIds.push(connectionId);
      } catch (error) {
        console.error(`Failed to auto-connect ${source.path}:`, error);
      }
    }

    return connectionIds;
  }

  async continuousDiscovery(
    scanConfig: DataSourceScan, 
    intervalMs: number = 60000,
    callback: (newSources: DiscoveredDataSource[]) => void
  ): Promise<{ stop: () => void }> {
    const knownSources = new Map<string, number>(); // path -> lastModified timestamp
    
    const scan = async () => {
      try {
        const discovered = await this.discoverDataSources(scanConfig);
        const newSources: DiscoveredDataSource[] = [];

        for (const source of discovered) {
          const lastKnown = knownSources.get(source.path);
          const currentModified = source.lastModified.getTime();

          if (!lastKnown || currentModified > lastKnown) {
            knownSources.set(source.path, currentModified);
            if (lastKnown) { // Only add to new sources if it's an update, not initial discovery
              newSources.push(source);
            }
          }
        }

        if (newSources.length > 0) {
          callback(newSources);
        }
      } catch (error) {
        console.error('Continuous discovery error:', error);
      }
    };

    // Initial scan
    await scan();

    const interval = setInterval(scan, intervalMs);

    return {
      stop: () => clearInterval(interval)
    };
  }

  private async scanDirectory(
    directory: string, 
    recursive: boolean, 
    maxFiles: number
  ): Promise<string[]> {
    const files: string[] = [];

    const scanDir = (dir: string, depth: number = 0) => {
      if (files.length >= maxFiles) return;
      
      try {
        const entries = fs.readdirSync(dir);
        
        for (const entry of entries) {
          if (files.length >= maxFiles) break;
          
          const fullPath = path.join(dir, entry);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory() && recursive && depth < 10) {
            scanDir(fullPath, depth + 1);
          } else if (stats.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    };

    scanDir(directory);
    return files;
  }

  private async analyzeDataSource(
    filePath: string, 
    stats: fs.Stats
  ): Promise<DiscoveredDataSource | null> {
    const ext = path.extname(filePath).toLowerCase();
    let type: 'csv' | 'json' | 'excel';
    let confidence = 0;
    let columns: string[] = [];
    let rowCount = 0;
    let metadata: any = {};

    try {
      switch (ext) {
        case '.csv':
          type = 'csv';
          ({ columns, rowCount, confidence, metadata } = await this.analyzeCSV(filePath));
          break;
        case '.json':
          type = 'json';
          ({ columns, rowCount, confidence, metadata } = await this.analyzeJSON(filePath));
          break;
        case '.xlsx':
        case '.xls':
          type = 'excel';
          ({ columns, rowCount, confidence, metadata } = await this.analyzeExcel(filePath));
          break;
        default:
          return null;
      }

      if (confidence < 0.5 || columns.length === 0) {
        return null;
      }

      return {
        path: filePath,
        type,
        size: stats.size,
        lastModified: stats.mtime,
        columns,
        rowCount,
        confidence,
        metadata
      };
    } catch (error) {
      return null;
    }
  }

  private async analyzeCSV(filePath: string): Promise<{
    columns: string[];
    rowCount: number;
    confidence: number;
    metadata: any;
  }> {
    return new Promise((resolve, reject) => {
      const lines: string[] = [];
      let lineCount = 0;
      
      const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
      let buffer = '';
      
      stream.on('data', (chunk) => {
        buffer += chunk;
        const newLines = buffer.split('\n');
        buffer = newLines.pop() || '';
        
        for (const line of newLines) {
          lines.push(line.trim());
          lineCount++;
          if (lineCount >= 100) { // Sample first 100 lines
            stream.destroy();
            break;
          }
        }
      });

      stream.on('end', () => {
        if (buffer.trim()) {
          lines.push(buffer.trim());
        }
        
        if (lines.length === 0) {
          resolve({ columns: [], rowCount: 0, confidence: 0, metadata: {} });
          return;
        }

        // Detect delimiter
        const delimiters = [',', ';', '\t', '|'];
        let bestDelimiter = ',';
        let maxColumns = 0;

        for (const delimiter of delimiters) {
          const columnCount = lines[0].split(delimiter).length;
          if (columnCount > maxColumns) {
            maxColumns = columnCount;
            bestDelimiter = delimiter;
          }
        }

        const firstRow = lines[0].split(bestDelimiter);
        const hasHeaders = this.detectHeaders(firstRow, lines.slice(1, 10), bestDelimiter);
        
        const columns = hasHeaders ? 
          firstRow.map(col => col.replace(/['"]/g, '').trim()) :
          firstRow.map((_, i) => `Column${i + 1}`);

        // Calculate confidence based on data consistency
        let confidence = 0.5;
        if (hasHeaders) confidence += 0.2;
        if (lines.length > 1) confidence += 0.2;
        if (this.validateCSVStructure(lines, bestDelimiter)) confidence += 0.1;

        resolve({
          columns,
          rowCount: Math.max(0, lines.length - (hasHeaders ? 1 : 0)),
          confidence: Math.min(1, confidence),
          metadata: {
            hasHeaders,
            delimiter: bestDelimiter,
            encoding: 'utf8'
          }
        });
      });

      stream.on('error', reject);
    });
  }

  private async analyzeJSON(filePath: string): Promise<{
    columns: string[];
    rowCount: number;
    confidence: number;
    metadata: any;
  }> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      if (!Array.isArray(data)) {
        return { columns: [], rowCount: 0, confidence: 0, metadata: {} };
      }

      if (data.length === 0) {
        return { columns: [], rowCount: 0, confidence: 0.3, metadata: {} };
      }

      // Get columns from first object
      const firstObject = data[0];
      if (typeof firstObject !== 'object' || firstObject === null) {
        return { columns: [], rowCount: 0, confidence: 0, metadata: {} };
      }

      const columns = Object.keys(firstObject);
      let confidence = 0.7;

      // Check structure consistency
      const consistentStructure = data.slice(0, 10).every(item => 
        typeof item === 'object' && item !== null &&
        columns.every(col => col in item)
      );

      if (consistentStructure) confidence += 0.2;
      if (columns.length > 0) confidence += 0.1;

      return {
        columns,
        rowCount: data.length,
        confidence: Math.min(1, confidence),
        metadata: {
          hasHeaders: true,
          encoding: 'utf8'
        }
      };
    } catch (error) {
      return { columns: [], rowCount: 0, confidence: 0, metadata: {} };
    }
  }

  private async analyzeExcel(filePath: string): Promise<{
    columns: string[];
    rowCount: number;
    confidence: number;
    metadata: any;
  }> {
    try {
      // Import XLSX dynamically to handle potential module issues
      const XLSX = await import('xlsx');
      const workbook = XLSX.readFile(filePath);
      
      const sheetNames = workbook.SheetNames;
      if (sheetNames.length === 0) {
        return { columns: [], rowCount: 0, confidence: 0, metadata: {} };
      }

      const firstSheet = workbook.Sheets[sheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      if (!Array.isArray(data) || data.length === 0) {
        return { columns: [], rowCount: 0, confidence: 0, metadata: {} };
      }

      const firstRow = data[0] as any[];
      const hasHeaders = firstRow.every(cell => typeof cell === 'string' && cell.length > 0);
      
      const columns = hasHeaders ?
        firstRow.map(cell => String(cell).trim()) :
        firstRow.map((_, i) => `Column${i + 1}`);

      let confidence = 0.6;
      if (hasHeaders) confidence += 0.2;
      if (data.length > 1) confidence += 0.1;
      if (sheetNames.length === 1) confidence += 0.1;

      return {
        columns,
        rowCount: Math.max(0, data.length - (hasHeaders ? 1 : 0)),
        confidence: Math.min(1, confidence),
        metadata: {
          hasHeaders,
          sheetNames,
          encoding: 'utf8'
        }
      };
    } catch (error) {
      return { columns: [], rowCount: 0, confidence: 0, metadata: {} };
    }
  }

  private detectHeaders(
    firstRow: string[], 
    sampleRows: string[], 
    delimiter: string
  ): boolean {
    if (sampleRows.length === 0) return true; // Assume headers if no data rows

    // Check if first row contains non-numeric values while data rows contain numbers
    const firstRowHasText = firstRow.some(cell => 
      isNaN(Number(cell.replace(/['"]/g, '').trim())) && 
      cell.replace(/['"]/g, '').trim().length > 0
    );

    if (!firstRowHasText) return false;

    const dataRowsHaveNumbers = sampleRows.some(row => {
      const cells = row.split(delimiter);
      return cells.some(cell => !isNaN(Number(cell.trim())) && cell.trim() !== '');
    });

    return firstRowHasText && dataRowsHaveNumbers;
  }

  private validateCSVStructure(lines: string[], delimiter: string): boolean {
    if (lines.length < 2) return false;

    const firstRowLength = lines[0].split(delimiter).length;
    
    // Check that at least 80% of rows have consistent column count
    const consistentRows = lines.slice(1).filter(line => 
      line.split(delimiter).length === firstRowLength
    );

    return consistentRows.length >= lines.length * 0.8;
  }

  async getDiscoveryStats(discovered: DiscoveredDataSource[]): Promise<{
    totalSources: number;
    byType: Record<string, number>;
    totalSize: number;
    avgConfidence: number;
    topColumns: { name: string; frequency: number }[];
  }> {
    const byType: Record<string, number> = {};
    let totalSize = 0;
    let totalConfidence = 0;
    const columnFrequency: Record<string, number> = {};

    for (const source of discovered) {
      byType[source.type] = (byType[source.type] || 0) + 1;
      totalSize += source.size;
      totalConfidence += source.confidence;

      for (const column of source.columns) {
        const normalized = column.toLowerCase().trim();
        columnFrequency[normalized] = (columnFrequency[normalized] || 0) + 1;
      }
    }

    const topColumns = Object.entries(columnFrequency)
      .map(([name, frequency]) => ({ name, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      totalSources: discovered.length,
      byType,
      totalSize,
      avgConfidence: discovered.length > 0 ? totalConfidence / discovered.length : 0,
      topColumns
    };
  }
}