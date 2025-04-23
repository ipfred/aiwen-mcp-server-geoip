#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// Response interfaces
interface AiWenResponse {
  code: number;
  msg: string;
  data?: string;
}


interface IPLocationResponse {
  code: string;
  data: {
    continent: string;
    country: string;
    owner: string;
    isp: string;
    zipcode: string;
    timezone: string;
    accuracy: string;
    source: string;
    areacode: string;
    adcode: string;
    asnumber: string;
    lat: string;
    lng: string;
    radius: string;
    prov: string;
    city: string;
  };
  charge: boolean;
  msg: string;
  ip: string;
  coordsys: string;
}


function getApiKey(): string {
    const apiKey = process.env.AIWEN_API_KEY;
    if (!apiKey) {
      console.error("AIWEN_API_KEY environment variable is not set");
      process.exit(1);
    }
    return apiKey;
  }

const AIWEN_API_KEY = getApiKey();

// Tool definitions


const IP_LOCATION_TOOL: Tool = {
  name: "aiwen_ip_location",
  description: "IP定位 根据IP地址获取IP位置(城市级)、使用者、运营商、经纬度等信息",
  inputSchema: {
    type: "object",
    properties: {
      ip: {
        type: "string",
        description: "IP地址 IPv4地址",
      }
    },
    required: ["ip"],
  }
}


const MAPS_TOOLS = [
  IP_LOCATION_TOOL,
] as const;

const API_URL = "https://api.ipplus360.com/ip/geo/v1";

// API handlers

async function handleIPLocation(
  ip: string,
) {
  const city_loc_url = `${API_URL}/city/`;
  const url = new URL(city_loc_url);
  url.searchParams.append("key", AIWEN_API_KEY);
  url.searchParams.append("channel", "node_mcp");
  url.searchParams.append("coordsys", "WGS84");
  url.searchParams.append("ip", ip);

  const response = await fetch(url.toString());
  const data = await response.json() as IPLocationResponse;

  if (data.code !== "Success") {
    return {
      content: [{
        type: "text",
        text: `IP address query failed: ${data.msg || data.code}`
      }],
      isError: true
    }
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify(data.data, null, 2)
    }],
    isError: false
  }
}


// Server setup
const server = new Server(
  {
    name: "mcp-server/aiwen_geoip",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: MAPS_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      
      case "aiwen_ip_location": {
        const {ip} = request.params.arguments as {
          ip: string;
        };
        return await handleIPLocation(ip);
      }

      default:
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${request.params.name}`
          }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Awien geoip MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});