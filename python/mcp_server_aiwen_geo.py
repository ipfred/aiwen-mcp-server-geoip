import os
import json

import httpx

from mcp.server.fastmcp import FastMCP


# 创建 MCP 服务器实例
mcp = FastMCP("aiwen_ip_geo")

# key的设置 sse服务和stdio key设置
# os.environ["AIWEN_API_KEY"] = "<AIWEN_API_KEY>"
# api_key = os.getenv('AIWEN_API_KEY')

def get_api_key():
    api_key = os.getenv("AIWEN_API_KEY")
    if not api_key:
        print("AIWEN_API_KEY environment variable is not set")
        exit(1)
    return api_key

AIWEN_API_KEY = get_api_key()

api_url = "https://api.ipplus360.com/ip/geo/v1"

import os

# 设置环境变量
os.environ["FASTMCP_DEBUG"] = "true"


@mcp.tool(description="IP定位 根据IP地址获取IP位置(城市级)、使用者、运营商、经纬度等信息")
async def aiwen_ip_location(ip=None):
    try:
        # 获取API密钥
        if not AIWEN_API_KEY:
            raise Exception("Can not found API key.")
 
        # https://api.ipplus360.com/ip/geo/v1/city/?key=您申请的key&ip=您需要查询的ip&coordsys=WGS84 
        url = f"{api_url}/city/"
        
        params = {
            "key": f"{AIWEN_API_KEY}",
            "channel": "py_mcp",
            "coordsys": "WGS84",
            "ip": ip
        }
 
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            result = response.json()
            print(result)
 
        if result.get("code") != "Success":
            error_msg = result.get("message", "unkown error")
            raise Exception(f"API response error: {error_msg}")
        data = result.get("data")
        return json.dumps(data, ensure_ascii=False)
 
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
    except KeyError as e:
        raise Exception(f"Failed to parse reponse: {str(e)}") from e




    
if __name__ == "__main__":
    from argparse import ArgumentParser
    parser = ArgumentParser()
    parser.add_argument("--transport", choices=["stdio", "sse"], default="stdio")
    args = parser.parse_args()
    print(args.transport)
    if args.transport == "stdio":
        mcp.run("stdio")
    elif args.transport == "sse":
        mcp.run("sse")
    else:
        mcp.run()
    


