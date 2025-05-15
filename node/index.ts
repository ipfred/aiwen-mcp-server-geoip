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
interface IPUUResponse {
  code: number;
  msg: string;
  data: string;
}

interface AiWenResponse {
  code: string;
  data: object;
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

function getLocationAccuracy(): { v4_acc: string; v6_acc: string } {
  const validValues = ["city", "district", "street"];

  let v4_acc = process.env.IPV4_ACCURACY || "city";
  let v6_acc = process.env.IPV6_ACCURACY || "city";
  if (!validValues.includes(v4_acc)) {
    console.error("Invalid IPV4_ACCURACY. Valid options are: city, district, street");
    process.exit(1);
  }

  if (!validValues.includes(v6_acc)) {
    console.error("Invalid IPV6_ACCURACY. Valid options are: city, district, street");
    process.exit(1);
  }
  console.error("IPv4定位精度 IPV4_ACCURACY: ", v4_acc);
  console.error("IPv6定位精度 IPV6_ACCURACY: ", v6_acc);
  return { v4_acc, v6_acc };
}

const { v4_acc: IPV4_ACCURACY, v6_acc: IPV6_ACCURACY } = getLocationAccuracy();


// Tool definitions

const IP_LOCATION_TOOL: Tool = {
  name: "aiwen_ip_location",
  description: "IP定位 根据IP地址获取IP位置(支持城市、区县、街道三种精度)、经纬度、所属机构、运营商等信息",
  inputSchema: {
    type: "object",
    properties: {
      ip: {
        type: "string",
        description: "IP地址 IPv4或IPv6",
      }
    },
    required: ["ip"],
  }
};

const USER_NETWORK_IP: Tool = {
  name: "user_network_ip",
  description: "获取当前网络IP地址 根据当前网络IP地址获取位置信息",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const IP_USAGE_SCENE: Tool = {
  name: "ip_usage_scene",
  description: "根据IP地址获取IP使用场景 输出包括保留IP、未分配IP、组织机构、移动网络、家庭宽带、数据中心、企业专线、CDN、卫星通信、交换中心、Anycast等网络应用场景",
  inputSchema: {
    type: "object",
    properties: {
      ip: {
        type: "string",
        description: "IP地址 IPv4或IPv6",
      },
    },
    required: ["ip"],
  }
};

// ip_whois_info
const IP_WHOIS_INFO: Tool = {
  name: "ip_whois_info",
  description: "查询IP地址Whois注册信息 返回IP所属网段范围、所属机构名称、技术联系人、管理员等信息",
  inputSchema: {
    type: "object",
    properties: {
      ip: {
        type: "string",
        description: "IP地址 IPv4",
      },
    },
    required: ["ip"],
  }
};

// ip_as_mapping
const IP_AS_MAPPING: Tool = {
  name: "ip_as_mapping",
  description: "查询IP地址AS号(自治域号)信息 返回AS编号、AS名称、AS场景、AS所属的行业等",
  inputSchema: {
    type: "object",
    properties: {
      ip: {
        type: "string",
        description: "IP地址 IPv4",
      },
    },
    required: ["ip"],
  }
};

// ip_host_info
const IP_HOST_INFO: Tool = {
  name: "ip_host_info",
  description: "查询IP地址的宿主信息 返回IP的自治域编号(AS Number)、AS名称、运营商、所属机构等归属属性",
  inputSchema: {
    type: "object",
    properties: {
      ip: {
        type: "string",
        description: "IP地址 IPv4",
      },
    },
    required: ["ip"],
  }
};

// ip_risk_portrait
const IP_RISK_PORTRAIT: Tool = {
  name: "ip_risk_portrait",
  description: "查询IP地址风险画像 识别VPN、代理、秒拨、数据中心、Tor节点、端口扫描、暴力破解等高风险行为,输出风险评分、分级结果、IP位置等信息",
  inputSchema: {
    type: "object",
    properties: {
      ip: {
        type: "string",
        description: "IP地址 IPv4",
      },
    },
    required: ["ip"],
  }
};

// ip_identity_check
const IP_IDENTITY_CHECK: Tool = {
  name: "ip_identity_check",
  description: "根据IP地址判断访问者是否为真实用户或机器流量 返回真人概率(real_person_rate)、秒播概率(mb_rate)",
  inputSchema: {
    type: "object",
    properties: {
      ip: {
        type: "string",
        description: "IP地址 IPv4",
      },
    },
    required: ["ip"],
  }
};

// ip_industry_classify
const IP_INDUSTRY_CLASSIFY: Tool = {
  name: "ip_industry_classify",
  description: "IPv4行业 查询IP地址行业分类",
  inputSchema: {
    type: "object",
    properties: {
      ip: {
        type: "string",
        description: "IP地址 IPv4",
      },
    },
    required: ["ip"],
  }
};

const IP_TOOLS = [
  IP_LOCATION_TOOL,
  USER_NETWORK_IP,
  IP_USAGE_SCENE,
  IP_WHOIS_INFO,
  IP_AS_MAPPING,
  IP_HOST_INFO,
  IP_RISK_PORTRAIT,
  IP_IDENTITY_CHECK,
  IP_INDUSTRY_CLASSIFY,
] as const;

const API_HOST = "https://api.ipplus360.com";

// API handlers

const apiSuffixMap: Record<string, Record<string, string>> = {
    ipv4: {
      city: "ip/geo/v1/city/",
      district: "ip/geo/v1/district/",
      street: "ip/geo/v1/street/psi/",
    },
    ipv6: {
      city: "ip/geo/v1/ipv6/",
      district: "ip/geo/v1/ipv6/district/",
      street: "ip/geo/v1/ipv6/street/biz/",
    },
};

export class AiwenClient {
  private apiHost: string;
  private apiKey: string;

  constructor(apiHost: string, apiKey: string) {
    this.apiHost = apiHost;
    this.apiKey = apiKey;
  }

  private checkIpType(ip: string): "ipv4" | "ipv6" {
    return ip.includes(':') ? 'ipv6' : 'ipv4';
  }

  private async coreRequest(url: string, params: Record<string, any>) {

    const commonParams = {
      key: this.apiKey,
      channel: 'node_mcp'
    };
    const finalParams = new URLSearchParams({ ...params, ...commonParams });
    const fullUrl = `${url}?${finalParams.toString()}`;
    // logger.debug(`Making request to: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      method: 'GET'
    });
    const data = await response.json();
    return data;
  }

  async ipLocation(ip: string) {
    const ipType = this.checkIpType(ip);
    let apiSuffix: string;
    if (ipType === 'ipv4') {
      apiSuffix = apiSuffixMap.ipv4[IPV4_ACCURACY];
    } else {
      apiSuffix = apiSuffixMap.ipv6[IPV6_ACCURACY];
    }
    const url = `${this.apiHost}/${apiSuffix}`;
    const params = {
      ip,
      coordsys: "WGS84",
    };
    return await this.coreRequest(url, params);
  }

  async ipUsageScene(ip: string) {
    const ipType = this.checkIpType(ip);
    let apiSuffix: string;
    if (ipType === 'ipv4') {
      apiSuffix = "ip/info/v1/scene/";
    } else {
      apiSuffix = "ip/info/v1/ipv6Scene/"
    }
    const url = `${this.apiHost}/${apiSuffix}`;
    const params = {
      ip,
      lang: "cn",
    };
    return await this.coreRequest(url, params);
  }

  async ipWhoisInfo(ip: string) {
    const apiSuffix = "ip/info/v1/ipWhois";
    const url = `${this.apiHost}/${apiSuffix}`;
    return await this.coreRequest(url, {ip});
  }

  async IPAsMapping(ip: string) {
    const apiSuffix = "as/info/v1/asWhois";
    const url = `${this.apiHost}/${apiSuffix}`;
    return await this.coreRequest(url, {ip});
  }

  async ipHostInfo(ip: string) {
    const apiSuffix = "ip/geo/v1/host/"
    const url = `${this.apiHost}/${apiSuffix}`;
    return await this.coreRequest(url, {ip});
  }

  async ipRiskPortrait(ip: string) {
    const apiSuffix = "ip/info/v3/portrait/";
    const url = `${this.apiHost}/${apiSuffix}`;
    return await this.coreRequest(url, {ip});
  }
  async ipIdentityCheck(ip: string) {
    const apiSuffix = "ip/info/v1/person/";
    const url = `${this.apiHost}/${apiSuffix}`;
    return await this.coreRequest(url, {ip});
  }
  async ipIndustryClassify(ip: string) {
    const apiSuffix = "ip/info/v1/industry/";
    const url = `${this.apiHost}/${apiSuffix}`;
    return await this.coreRequest(url, {ip});
  }
}

const aiwenClient = new AiwenClient(API_HOST, AIWEN_API_KEY);


async function handleIPLocation(ip: string) {
  const data = await aiwenClient.ipLocation(ip) as AiWenResponse;

  return {
    content: [{
      type: "text",
      text: JSON.stringify(data, null, 2)
    }],
    isError: false
  }
}

async function handleNetworkIp(
) {
  const url = new URL("https://www.ipuu.net/ipuu/user/getIP");
  url.searchParams.append("channel", "node_mcp");

  const response = await fetch(url.toString());
  const data = await response.json() as IPUUResponse;
  if (data.code !== 200) {
    return {
      content: [{
        type: "text",
        text: `user network ip query failed: ${data.msg || data.code}`
      }],
      isError: true
    }
  }
  const ip = data.data
  return await handleIPLocation(ip);
}

async function handleIPUsageScene(ip: string) {
  const data = await aiwenClient.ipUsageScene(ip) as AiWenResponse;
  return {
    content: [{
      type: "text",
      text: JSON.stringify(data, null, 2)
    }],
    isError: false
  }
}
async function handleIPWhoisInfo(ip: string) {
  const data = await aiwenClient.ipWhoisInfo(ip) as AiWenResponse;
  return {
    content: [{
      type: "text",
      text: JSON.stringify(data, null, 2)
    }],
    isError: false
  }
}
async function handleIPAsMapping(ip: string) {
  const data = await aiwenClient.IPAsMapping(ip) as AiWenResponse;
  return {
    content: [{
      type: "text",
      text: JSON.stringify(data, null, 2)
    }],
    isError: false
  }
}
async function handleIPHostInfo(ip: string) {
  const data = await aiwenClient.ipHostInfo(ip) as AiWenResponse;
  return {
    content: [{
      type: "text",
      text: JSON.stringify(data, null, 2)
    }],
    isError: false
  }
}
async function handleIPRiskPortrait(ip: string) {
  const data = await aiwenClient.ipRiskPortrait(ip) as AiWenResponse;
  return {
    content: [{
      type: "text",
      text: JSON.stringify(data, null, 2)
    }],
    isError: false
  }
}
async function handleIPIdentityCheck(ip: string) {
  const data = await aiwenClient.ipIdentityCheck(ip) as AiWenResponse;
  return {
    content: [{
      type: "text",
      text: JSON.stringify(data, null, 2)
    }],
    isError: false
  }
}
async function handleIPIndustryClassify(ip: string) {
  const data = await aiwenClient.ipIndustryClassify(ip) as AiWenResponse;
  return {
    content: [{
      type: "text",
      text: JSON.stringify(data, null, 2)
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
  tools: IP_TOOLS,
}));

type ToolHandler = (ip: string) => Promise<any>;

const toolHandlers: Record<string, ToolHandler> = {
  aiwen_ip_location: handleIPLocation,
  user_network_ip: handleNetworkIp,
  ip_usage_scene: handleIPUsageScene,
  ip_whois_info: handleIPWhoisInfo,
  ip_as_mapping: handleIPAsMapping,
  ip_host_info: handleIPHostInfo,
  ip_risk_portrait: handleIPRiskPortrait,
  ip_identity_check: handleIPIdentityCheck,
  ip_industry_classify: handleIPIndustryClassify,
};

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const handler = toolHandlers[request.params.name];
    if (!handler) {
      return {
        content: [{
          type: "text",
          text: `Unknown tool: ${request.params.name}`
        }],
        isError: true
      };
    };
    if (request.params.name === "user_network_ip") {
      return await handleNetworkIp();
    }
    const { ip } = request.params.arguments as { ip: string };
    return await handler(ip);

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