#!/usr/bin/env node

/**
 * Test script to demonstrate visualization generation
 * Simulates the visualization queries without the interactive interface
 */

import fs from 'fs';

// Simple statistics functions
const stats = {
  mean: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
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

function generateSampleData() {
    const data = [];
    const baseDate = new Date('2024-01-01');
    
    for (let i = 0; i < 365; i++) {
        const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
        const month = date.getMonth() + 1;
        const dayOfWeek = date.getDay();
        
        const seasonalFactor = 1 + 0.3 * Math.sin(2 * Math.PI * i / 365);
        const weeklyFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.8 : 1.0;
        const randomFactor = 0.8 + Math.random() * 0.4;
        
        const sales = Math.round((100 + i * 0.1) * seasonalFactor * weeklyFactor * randomFactor);
        const revenue = sales * (50 + Math.random() * 20);
        const users = Math.round(sales * (0.8 + Math.random() * 0.4));
        
        data.push({
            date: date.toISOString().split('T')[0],
            sales: sales,
            revenue: Math.round(revenue),
            users: users,
            month: month,
            dayOfWeek: dayOfWeek
        });
    }
    
    return data;
}

function generateScatterPlot(data, xField, yField, title) {
    console.log(`\n🎨 Generating scatter plot: ${title}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const xData = data.map(d => d[xField]);
    const yData = data.map(d => d[yField]);
    
    const width = 600;
    const height = 400;
    const margin = { top: 50, right: 50, bottom: 50, left: 70 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    
    const xMin = Math.min(...xData);
    const xMax = Math.max(...xData);
    const yMin = Math.min(...yData);
    const yMax = Math.max(...yData);
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="${width/2}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#2c3e50">${title}</text>
  `;
    
    // Add axes
    svg += `
  <!-- X axis -->
  <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#bdc3c7" stroke-width="1"/>
  <!-- Y axis -->
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#bdc3c7" stroke-width="1"/>
  <text x="${margin.left + plotWidth/2}" y="${margin.top + plotHeight + 40}" text-anchor="middle" font-size="14" fill="#34495e">${xField}</text>
  <text x="${margin.left - 50}" y="${margin.top + plotHeight/2}" text-anchor="middle" font-size="14" fill="#34495e" transform="rotate(-90 ${margin.left - 50} ${margin.top + plotHeight/2})">${yField}</text>
  `;
    
    // Add data points
    for (let i = 0; i < xData.length; i++) {
        const x = margin.left + ((xData[i] - xMin) / (xMax - xMin)) * plotWidth;
        const y = height - margin.bottom - ((yData[i] - yMin) / (yMax - yMin)) * plotHeight;
        svg += `<circle cx="${x}" cy="${y}" r="3" fill="#3498db" opacity="0.7"/>\n`;
    }
    
    // Add correlation info
    const correlation = stats.correlation(xData, yData);
    svg += `<text x="${width - margin.right}" y="${margin.top - 10}" text-anchor="end" font-size="14" fill="#34495e">r = ${correlation.toFixed(3)}</text>`;
    
    svg += '</svg>';
    
    const filename = `scatter_${xField}_vs_${yField}.svg`;
    fs.writeFileSync(filename, svg);
    
    console.log(`✅ Scatter plot saved as: ${filename}`);
    console.log(`📊 Correlation: ${correlation.toFixed(3)}`);
    console.log(`📈 Data points: ${xData.length}`);
}

async function testVisualizations() {
    console.log('🧪 Testing DataViz Visualization Generation');
    console.log('==========================================\n');
    
    // Generate sample data
    console.log('🔄 Generating sample data...');
    const data = generateSampleData();
    console.log(`✅ Generated ${data.length} records`);
    
    // Test scatter plot
    console.log('\n1️⃣ Testing scatter plot generation...');
    generateScatterPlot(data, 'revenue', 'sales', 'Revenue vs Sales Scatter Plot');
    
    console.log('\n🎉 Visualization generated successfully!');
    console.log('📁 Check the current directory for:');
    console.log('   • scatter_revenue_vs_sales.svg');
    console.log('\n💡 You can open this file in any browser to view the chart!');
    
    // Show some statistics
    const sales = data.map(d => d.sales);
    const revenue = data.map(d => d.revenue);
    console.log('\n📊 Sample Data Statistics:');
    console.log(`   Sales: ${Math.min(...sales)} - ${Math.max(...sales)} (avg: ${stats.mean(sales).toFixed(2)})`);
    console.log(`   Revenue: ${Math.min(...revenue)} - ${Math.max(...revenue)} (avg: ${stats.mean(revenue).toFixed(2)})`);
    console.log(`   Correlation: ${stats.correlation(sales, revenue).toFixed(3)}`);
}

testVisualizations().catch(console.error);