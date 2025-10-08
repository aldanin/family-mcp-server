#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import pkg from 'pg';
const { Pool } = pkg;

// Database connection pool
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'thedaninfamily',
  user: 'postgres',
  password: 'Roland@jv89', // Update with your actual password
});

// Define the tools
const tools: Tool[] = [
  {
    name: "getDPOC",
    description: "Get the EPOCH number of DPOC (the oldest birthdate in the members table)",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "getEvents",
    description: "Get events for a specific family member. If ref-date is provided, return events from that date onwards. Otherwise, return all events from DPOC.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the family member",
        },
        refDate: {
          type: "number",
          description: "Optional reference date as EPOCH number. If not provided, uses DPOC",
        },
      },
      required: ["name"],
    },
  },
];

// Create server instance
const server = new Server(
  {
    name: "family-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to get DPOC
async function getDPOCValue(): Promise<number> {
  const result = await pool.query(`
    SELECT EXTRACT(EPOCH FROM MIN(birthdate))::bigint AS dpoc
    FROM members
  `);
  return result.rows[0].dpoc;
}

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "getDPOC") {
      const dpoc = await getDPOCValue();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              dpoc: dpoc,
              description: "EPOCH timestamp of the oldest birthdate in the members table",
            }, null, 2),
          },
        ],
      };
    } else if (name === "getEvents") {
      const memberName = args.name as string;
      let refDate = args.refDate as number | undefined;

      // If no ref date provided, use DPOC
      if (!refDate) {
        refDate = await getDPOCValue();
      }

      // Convert EPOCH to PostgreSQL timestamp
      const refDateSQL = `to_timestamp(${refDate})`;

      // Query events for the member
      const result = await pool.query(
        `
        SELECT 
          e.event_date,
          e.event_type,
          m.name,
          EXTRACT(EPOCH FROM e.event_date)::bigint AS event_epoch
        FROM events e
        JOIN members m ON e.member_id = m.id
        WHERE m.name = $1 AND e.event_date >= ${refDateSQL}
        ORDER BY e.event_date
        `,
        [memberName]
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              name: memberName,
              refDate: refDate,
              events: result.rows,
              count: result.rows.length,
            }, null, 2),
          },
        ],
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Family MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
