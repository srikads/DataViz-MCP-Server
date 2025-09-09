#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DataVizTools } from './tools/index.js';

class DataVizMCPServer {
  private server: Server;
  private dataVizTools: DataVizTools;

  constructor() {
    this.server = new Server(
      {
        name: 'dataviz-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.dataVizTools = new DataVizTools();
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.dataVizTools.getTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.dataVizTools.handleToolCall(name, args || {});
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: `Failed to execute tool ${name}: ${errorMessage}`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log server startup (this will be sent to stderr, not interfering with MCP protocol)
    console.error('DataViz MCP Server started successfully');
    console.error('Available tools:');
    this.dataVizTools.getTools().forEach(tool => {
      console.error(`  - ${tool.name}: ${tool.description}`);
    });
  }
}

// Start the server
const server = new DataVizMCPServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});