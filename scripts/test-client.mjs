import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import EventSource from "eventsource";

const SERVER_URL = process.env.MCP_URL ?? "http://localhost:6402";
const MEMBER_NAME = process.env.MCP_MEMBER_NAME ?? process.argv[2];

// Provide EventSource implementation for Node.js
globalThis.EventSource = EventSource;

function logSection(title) {
  console.log("\n=== " + title + " ===");
}

function prettyPrint(label, value) {
  logSection(label);
  console.log(value);
//   console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
}

const client = new Client(
  {
    name: "family-mcp-test-client",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const transport = new SSEClientTransport(new URL("/sse", SERVER_URL));

async function main() {
  console.log(`Connecting to MCP server at ${SERVER_URL}...`);
  await client.connect(transport);
  console.log("Connected.\n");

  const tools = await client.listTools();
  prettyPrint("Available tools", tools);

  const dpochResult = await client.callTool({
    name: "getDPOCH",
    arguments: {},
  });
  prettyPrint("getDPOCH result", dpochResult);

   const getFamilyResult = await client.callTool({
    name: "getFamily",
    arguments: {},
  });
  prettyPrint("getFamily result", getFamilyResult);


  if (MEMBER_NAME) {
    const eventsResult = await client.callTool({
      name: "getEvents",
      arguments: { name: MEMBER_NAME },
    });
    prettyPrint(`getEvents result for ${MEMBER_NAME}`, eventsResult);
  } else {
    console.log("\nTip: pass a member name as argv[2] or set MCP_MEMBER_NAME to test getEvents.");
  }
}

main()
  .catch((error) => {
    console.error("Test client failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await client.close();
    } catch (error) {
      // ignore close errors
    }
  });
