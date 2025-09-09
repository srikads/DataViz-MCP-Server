import { createCanvas } from 'canvas';
import * as d3 from 'd3';
import { DataPoint, VisualizationConfig } from '../types/index.js';

export class VisualizationEngine {
  
  async generateVisualization(config: VisualizationConfig): Promise<{
    svg: string;
    metadata: {
      type: string;
      width: number;
      height: number;
      dataPoints: number;
    };
  }> {
    const width = config.width || 800;
    const height = config.height || 600;
    
    let svg: string;
    
    switch (config.type) {
      case 'line':
        svg = await this.createLineChart(config, width, height);
        break;
      case 'bar':
        svg = await this.createBarChart(config, width, height);
        break;
      case 'scatter':
        svg = await this.createScatterPlot(config, width, height);
        break;
      case 'histogram':
        svg = await this.createHistogram(config, width, height);
        break;
      case 'box':
        svg = await this.createBoxPlot(config, width, height);
        break;
      case 'heatmap':
        svg = await this.createHeatmap(config, width, height);
        break;
      case 'pie':
        svg = await this.createPieChart(config, width, height);
        break;
      default:
        throw new Error(`Unsupported visualization type: ${config.type}`);
    }
    
    return {
      svg,
      metadata: {
        type: config.type,
        width,
        height,
        dataPoints: config.data.length
      }
    };
  }

  private async createLineChart(config: VisualizationConfig, width: number, height: number): Promise<string> {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xKey = config.xAxis || 'index';
    const yKey = config.yAxis!;
    
    // Prepare data
    const data = config.data.map((d, i) => ({
      x: xKey === 'index' ? i : d.values[xKey] as number,
      y: d.values[yKey] as number
    })).filter(d => !isNaN(d.x) && !isNaN(d.y));

    if (data.length === 0) {
      return this.createEmptyChart(width, height, 'No valid data for line chart');
    }

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y) as [number, number])
      .range([innerHeight, 0]);

    // Create line generator
    const line = d3.line<{x: number, y: number}>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Generate SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g transform="translate(${margin.left},${margin.top})">`;
    
    // Add axes
    svg += this.createXAxis(xScale, innerHeight, xKey);
    svg += this.createYAxis(yScale, yKey);
    
    // Add line
    svg += `<path d="${line(data)}" fill="none" stroke="steelblue" stroke-width="2"/>`;
    
    // Add data points
    for (const point of data) {
      svg += `<circle cx="${xScale(point.x)}" cy="${yScale(point.y)}" r="3" fill="steelblue"/>`;
    }
    
    // Add title
    if (config.title) {
      svg += `<text x="${innerWidth / 2}" y="-5" text-anchor="middle" font-size="16" font-weight="bold">${config.title}</text>`;
    }
    
    svg += '</g></svg>';
    return svg;
  }

  private async createBarChart(config: VisualizationConfig, width: number, height: number): Promise<string> {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xKey = config.xAxis!;
    const yKey = config.yAxis!;
    
    // Prepare data
    const data = config.data.map(d => ({
      x: String(d.values[xKey]),
      y: d.values[yKey] as number
    })).filter(d => !isNaN(d.y));

    if (data.length === 0) {
      return this.createEmptyChart(width, height, 'No valid data for bar chart');
    }

    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.x))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.y) as number])
      .range([innerHeight, 0]);

    // Generate SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g transform="translate(${margin.left},${margin.top})">`;
    
    // Add axes
    svg += this.createCategoricalXAxis(data.map(d => d.x), xScale, innerHeight);
    svg += this.createYAxis(yScale, yKey);
    
    // Add bars
    for (const point of data) {
      const barHeight = innerHeight - yScale(point.y);
      svg += `<rect x="${xScale(point.x)}" y="${yScale(point.y)}" width="${xScale.bandwidth()}" height="${barHeight}" fill="steelblue"/>`;
    }
    
    // Add title
    if (config.title) {
      svg += `<text x="${innerWidth / 2}" y="-5" text-anchor="middle" font-size="16" font-weight="bold">${config.title}</text>`;
    }
    
    svg += '</g></svg>';
    return svg;
  }

  private async createScatterPlot(config: VisualizationConfig, width: number, height: number): Promise<string> {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xKey = config.xAxis!;
    const yKey = config.yAxis!;
    const colorKey = config.colorBy;
    
    // Prepare data
    const data = config.data.map(d => ({
      x: d.values[xKey] as number,
      y: d.values[yKey] as number,
      color: colorKey ? String(d.values[colorKey]) : 'default'
    })).filter(d => !isNaN(d.x) && !isNaN(d.y));

    if (data.length === 0) {
      return this.createEmptyChart(width, height, 'No valid data for scatter plot');
    }

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y) as [number, number])
      .range([innerHeight, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Generate SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g transform="translate(${margin.left},${margin.top})">`;
    
    // Add axes
    svg += this.createXAxis(xScale, innerHeight, xKey);
    svg += this.createYAxis(yScale, yKey);
    
    // Add points
    for (const point of data) {
      const color = colorKey ? colorScale(point.color) : 'steelblue';
      svg += `<circle cx="${xScale(point.x)}" cy="${yScale(point.y)}" r="4" fill="${color}" opacity="0.7"/>`;
    }
    
    // Add title
    if (config.title) {
      svg += `<text x="${innerWidth / 2}" y="-5" text-anchor="middle" font-size="16" font-weight="bold">${config.title}</text>`;
    }
    
    svg += '</g></svg>';
    return svg;
  }

  private async createHistogram(config: VisualizationConfig, width: number, height: number): Promise<string> {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xKey = config.xAxis!;
    
    // Prepare data
    const values = config.data
      .map(d => d.values[xKey] as number)
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      return this.createEmptyChart(width, height, 'No valid data for histogram');
    }

    // Create bins
    const bins = d3.histogram()
      .domain(d3.extent(values) as [number, number])
      .thresholds(20)(values);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(values) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) as number])
      .range([innerHeight, 0]);

    // Generate SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g transform="translate(${margin.left},${margin.top})">`;
    
    // Add axes
    svg += this.createXAxis(xScale, innerHeight, xKey);
    svg += this.createYAxis(yScale, 'Frequency');
    
    // Add bars
    for (const bin of bins) {
      if (bin.x0 !== undefined && bin.x1 !== undefined) {
        const barWidth = xScale(bin.x1) - xScale(bin.x0) - 1;
        const barHeight = innerHeight - yScale(bin.length);
        svg += `<rect x="${xScale(bin.x0)}" y="${yScale(bin.length)}" width="${barWidth}" height="${barHeight}" fill="steelblue" opacity="0.7"/>`;
      }
    }
    
    // Add title
    if (config.title) {
      svg += `<text x="${innerWidth / 2}" y="-5" text-anchor="middle" font-size="16" font-weight="bold">${config.title}</text>`;
    }
    
    svg += '</g></svg>';
    return svg;
  }

  private async createBoxPlot(config: VisualizationConfig, width: number, height: number): Promise<string> {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const yKey = config.yAxis!;
    const groupKey = config.groupBy;
    
    let groupedData: Map<string, number[]>;
    
    if (groupKey) {
      groupedData = new Map();
      for (const point of config.data) {
        const group = String(point.values[groupKey]);
        const value = point.values[yKey] as number;
        if (!isNaN(value)) {
          if (!groupedData.has(group)) {
            groupedData.set(group, []);
          }
          groupedData.get(group)!.push(value);
        }
      }
    } else {
      const values = config.data
        .map(d => d.values[yKey] as number)
        .filter(v => !isNaN(v));
      groupedData = new Map([['All Data', values]]);
    }

    if (groupedData.size === 0) {
      return this.createEmptyChart(width, height, 'No valid data for box plot');
    }

    // Calculate box plot statistics for each group
    const boxData = Array.from(groupedData.entries()).map(([group, values]) => {
      values.sort((a, b) => a - b);
      const q1 = d3.quantile(values, 0.25) as number;
      const median = d3.quantile(values, 0.5) as number;
      const q3 = d3.quantile(values, 0.75) as number;
      const iqr = q3 - q1;
      const min = Math.max(d3.min(values) as number, q1 - 1.5 * iqr);
      const max = Math.min(d3.max(values) as number, q3 + 1.5 * iqr);
      
      return { group, q1, median, q3, min, max };
    });

    // Create scales
    const xScale = d3.scaleBand()
      .domain(boxData.map(d => d.group))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(boxData.flatMap(d => [d.min, d.max])) as [number, number])
      .range([innerHeight, 0]);

    // Generate SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g transform="translate(${margin.left},${margin.top})">`;
    
    // Add axes
    svg += this.createCategoricalXAxis(boxData.map(d => d.group), xScale, innerHeight);
    svg += this.createYAxis(yScale, yKey);
    
    // Add box plots
    for (const box of boxData) {
      const x = xScale(box.group)! + xScale.bandwidth() / 2;
      const boxWidth = xScale.bandwidth() * 0.6;
      
      // Box
      svg += `<rect x="${x - boxWidth/2}" y="${yScale(box.q3)}" width="${boxWidth}" height="${yScale(box.q1) - yScale(box.q3)}" fill="steelblue" opacity="0.7" stroke="black"/>`;
      
      // Median line
      svg += `<line x1="${x - boxWidth/2}" y1="${yScale(box.median)}" x2="${x + boxWidth/2}" y2="${yScale(box.median)}" stroke="black" stroke-width="2"/>`;
      
      // Whiskers
      svg += `<line x1="${x}" y1="${yScale(box.q3)}" x2="${x}" y2="${yScale(box.max)}" stroke="black"/>`;
      svg += `<line x1="${x}" y1="${yScale(box.q1)}" x2="${x}" y2="${yScale(box.min)}" stroke="black"/>`;
      
      // Whisker caps
      svg += `<line x1="${x - boxWidth/4}" y1="${yScale(box.max)}" x2="${x + boxWidth/4}" y2="${yScale(box.max)}" stroke="black"/>`;
      svg += `<line x1="${x - boxWidth/4}" y1="${yScale(box.min)}" x2="${x + boxWidth/4}" y2="${yScale(box.min)}" stroke="black"/>`;
    }
    
    // Add title
    if (config.title) {
      svg += `<text x="${innerWidth / 2}" y="-5" text-anchor="middle" font-size="16" font-weight="bold">${config.title}</text>`;
    }
    
    svg += '</g></svg>';
    return svg;
  }

  private async createHeatmap(config: VisualizationConfig, width: number, height: number): Promise<string> {
    // For heatmap, we'll create a correlation matrix visualization
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Get numeric columns and calculate correlation matrix
    const numericColumns = this.getNumericColumns(config.data);
    const correlationMatrix = this.calculateCorrelationMatrix(config.data, numericColumns);

    if (numericColumns.length === 0) {
      return this.createEmptyChart(width, height, 'No numeric data for heatmap');
    }

    const cellSize = Math.min(innerWidth, innerHeight) / numericColumns.length;

    // Generate SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g transform="translate(${margin.left},${margin.top})">`;
    
    // Add cells
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = 0; j < numericColumns.length; j++) {
        const correlation = correlationMatrix[i][j];
        const color = this.getHeatmapColor(correlation);
        const x = j * cellSize;
        const y = i * cellSize;
        
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" stroke="white"/>`;
        svg += `<text x="${x + cellSize/2}" y="${y + cellSize/2}" text-anchor="middle" dy="0.35em" font-size="10" fill="white">${correlation.toFixed(2)}</text>`;
      }
    }
    
    // Add labels
    for (let i = 0; i < numericColumns.length; i++) {
      const label = numericColumns[i];
      svg += `<text x="-5" y="${i * cellSize + cellSize/2}" text-anchor="end" dy="0.35em" font-size="10">${label}</text>`;
      svg += `<text x="${i * cellSize + cellSize/2}" y="-5" text-anchor="middle" dy="0.35em" font-size="10" transform="rotate(-45, ${i * cellSize + cellSize/2}, -5)">${label}</text>`;
    }
    
    // Add title
    if (config.title) {
      svg += `<text x="${numericColumns.length * cellSize / 2}" y="-25" text-anchor="middle" font-size="16" font-weight="bold">${config.title}</text>`;
    }
    
    svg += '</g></svg>';
    return svg;
  }

  private async createPieChart(config: VisualizationConfig, width: number, height: number): Promise<string> {
    const radius = Math.min(width, height) / 2 - 40;
    const centerX = width / 2;
    const centerY = height / 2;

    const categoryKey = config.xAxis!;
    
    // Aggregate data by category
    const categoryCount = new Map<string, number>();
    for (const point of config.data) {
      const category = String(point.values[categoryKey]);
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    }

    if (categoryCount.size === 0) {
      return this.createEmptyChart(width, height, 'No data for pie chart');
    }

    const total = Array.from(categoryCount.values()).reduce((sum, count) => sum + count, 0);
    const pie = d3.pie<[string, number]>().value(d => d[1]);
    const arc = d3.arc<d3.PieArcDatum<[string, number]>>()
      .innerRadius(0)
      .outerRadius(radius);

    const data = Array.from(categoryCount.entries());
    const arcs = pie(data);
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Generate SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g transform="translate(${centerX},${centerY})">`;
    
    // Add slices
    for (let i = 0; i < arcs.length; i++) {
      const arcData = arcs[i];
      const color = colorScale(String(i));
      const pathData = arc(arcData);
      
      if (pathData) {
        svg += `<path d="${pathData}" fill="${color}" stroke="white" stroke-width="2"/>`;
        
        // Add labels
        const labelArc = d3.arc<d3.PieArcDatum<[string, number]>>()
          .innerRadius(radius * 0.6)
          .outerRadius(radius * 0.6);
        
        const labelPos = labelArc.centroid(arcData);
        const percentage = ((arcData.data[1] / total) * 100).toFixed(1);
        svg += `<text x="${labelPos[0]}" y="${labelPos[1]}" text-anchor="middle" font-size="12">${arcData.data[0]}</text>`;
        svg += `<text x="${labelPos[0]}" y="${labelPos[1] + 15}" text-anchor="middle" font-size="10">${percentage}%</text>`;
      }
    }
    
    // Add title
    if (config.title) {
      svg += `<text x="0" y="${-radius - 20}" text-anchor="middle" font-size="16" font-weight="bold">${config.title}</text>`;
    }
    
    svg += '</g></svg>';
    return svg;
  }

  private createXAxis(scale: d3.ScaleLinear<number, number>, height: number, label: string): string {
    const ticks = scale.ticks(8);
    let axis = `<g transform="translate(0,${height})">`;
    
    // Axis line
    axis += `<line x1="0" y1="0" x2="${scale.range()[1]}" y2="0" stroke="black"/>`;
    
    // Ticks and labels
    for (const tick of ticks) {
      const x = scale(tick);
      axis += `<line x1="${x}" y1="0" x2="${x}" y2="6" stroke="black"/>`;
      axis += `<text x="${x}" y="20" text-anchor="middle" font-size="12">${tick}</text>`;
    }
    
    // Label
    axis += `<text x="${scale.range()[1] / 2}" y="35" text-anchor="middle" font-size="14">${label}</text>`;
    axis += '</g>';
    
    return axis;
  }

  private createYAxis(scale: d3.ScaleLinear<number, number>, label: string): string {
    const ticks = scale.ticks(8);
    let axis = '<g>';
    
    // Axis line
    axis += `<line x1="0" y1="0" x2="0" y2="${scale.range()[0]}" stroke="black"/>`;
    
    // Ticks and labels
    for (const tick of ticks) {
      const y = scale(tick);
      axis += `<line x1="0" y1="${y}" x2="-6" y2="${y}" stroke="black"/>`;
      axis += `<text x="-10" y="${y}" text-anchor="end" dy="0.35em" font-size="12">${tick}</text>`;
    }
    
    // Label
    axis += `<text transform="rotate(-90)" x="${-scale.range()[0] / 2}" y="-35" text-anchor="middle" font-size="14">${label}</text>`;
    axis += '</g>';
    
    return axis;
  }

  private createCategoricalXAxis(categories: string[], scale: d3.ScaleBand<string>, height: number): string {
    let axis = `<g transform="translate(0,${height})">`;
    
    // Axis line
    axis += `<line x1="0" y1="0" x2="${scale.range()[1]}" y2="0" stroke="black"/>`;
    
    // Ticks and labels
    for (const category of categories) {
      const x = scale(category)! + scale.bandwidth() / 2;
      axis += `<line x1="${x}" y1="0" x2="${x}" y2="6" stroke="black"/>`;
      axis += `<text x="${x}" y="20" text-anchor="middle" font-size="12">${category}</text>`;
    }
    
    axis += '</g>';
    return axis;
  }

  private createEmptyChart(width: number, height: number, message: string): string {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-size="16" fill="#6c757d">${message}</text>
    </svg>`;
  }

  private getNumericColumns(data: DataPoint[]): string[] {
    if (data.length === 0) return [];
    
    const firstRow = data[0];
    return Object.keys(firstRow.values).filter(key => {
      return data.every(point => 
        typeof point.values[key] === 'number' && !isNaN(point.values[key] as number)
      );
    });
  }

  private calculateCorrelationMatrix(data: DataPoint[], columns: string[]): number[][] {
    const matrix: number[][] = [];
    
    for (let i = 0; i < columns.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < columns.length; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          const values1 = data.map(point => point.values[columns[i]] as number);
          const values2 = data.map(point => point.values[columns[j]] as number);
          
          try {
            const correlation = this.pearsonCorrelation(values1, values2);
            matrix[i][j] = correlation;
          } catch {
            matrix[i][j] = 0;
          }
        }
      }
    }
    
    return matrix;
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private getHeatmapColor(correlation: number): string {
    // Color scale from blue (negative) to white (zero) to red (positive)
    const abs = Math.abs(correlation);
    const intensity = Math.floor(abs * 255);
    
    if (correlation > 0) {
      return `rgb(${255}, ${255 - intensity}, ${255 - intensity})`;
    } else {
      return `rgb(${255 - intensity}, ${255 - intensity}, ${255})`;
    }
  }
}