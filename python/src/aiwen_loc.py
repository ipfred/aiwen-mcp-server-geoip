import os
import json

import httpx

from mcp.server.fastmcp import FastMCP
import mcp.types as types


# 创建 MCP 服务器实例
mcp = FastMCP("aiwen_ip_geo")

# key的设置 sse服务和stdio key设置
# os.environ["AIWEN_API_KEY"] = "<AIWEN_API_KEY>"
# api_key = os.getenv('AIWEN_API_KEY')

def get_api_key():
    api_key = os.getenv("AIWEN_API_KEY")
    if not api_key:
        print("AIWEN_API_KEY environment variable is not set")
    return api_key

AIWEN_API_KEY = get_api_key()

api_url = "https://api.ipplus360.com/ip/geo/v1"

import os

# 设置环境变量
os.environ["FASTMCP_DEBUG"] = "true"


async def get_ip_location(ip):
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
    return result
        


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


# 获取用户当前访问网络的IP地址
@mcp.tool(description="获取当前网络IP地址 根据当前网络IP地址获取位置信息")
async def user_network_ip():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("https://www.ipuu.net/ipuu/user/getIP")
            response.raise_for_status()
            result = response.json()
            ip = result.get("data")
            assert ip, "获取用户IP地址失败"
        result = await get_ip_location(ip)
 
        if result.get("code") != "Success":
            error_msg = result.get("message", "unkown error")
            raise Exception(f"API response error: {error_msg}")
        data = result.get("data")
        return json.dumps(data, ensure_ascii=False)

    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
    except KeyError as e:
        raise Exception(f"Failed to parse reponse: {str(e)}") from e

    

    


