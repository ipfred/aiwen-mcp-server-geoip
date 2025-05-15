import os
import json
import logging
import httpx

from mcp.server.fastmcp import FastMCP
import mcp.types as types
from pydantic import Field

logger = logging.getLogger(__name__)


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

def get_location_accuracy():
    v4_acc = os.getenv("IPV4_ACCURACY")
    if not v4_acc:
        print("IPV4_ACCURACY environment use default `city`")
        v4_acc = 'city'
    v6_acc = os.getenv("IPV6_ACCURACY")
    if not v6_acc:
        print("IPV6_ACCURACY environment use default `city`")
        v6_acc = 'city'
    if v4_acc not in ('city', 'district', 'address'):
        exit("Invalid IPV4_ACCURACY. Valid options are: city, district, street")
    if v6_acc not in ('city', 'district', 'address'):
        exit("Invalid IPV6_ACCURACY. Valid options are: city, district, street")
    return v4_acc, v6_acc

AIWEN_API_KEY = get_api_key()
IPV4_ACCURACY, IPV6_ACCURACY = get_location_accuracy()

api_host = "https://api.ipplus360.com"

# 设置环境变量
os.environ["FASTMCP_DEBUG"] = "true"


api_suffix_map = {
    "ipv4" : {
        "city": "ip/geo/v1/city/",
        "district": "ip/geo/v1/district/",
        "street": "ip/geo/v1/street/psi/"
    },
    "ipv6" : {
        "city": "ip/geo/v1/ipv6/",
        "district": "ip/geo/v1/ipv6/district/",
        "street": "ip/geo/v1/ipv6/street/biz/"
    }
}

class AiwenClient:

    def __init__(self, api_host, api_key):
        self.api_host = api_host
        self.api_key = api_key

    def check_ip_type(self, ip):
        return 'ipv6' if ":" in ip else 'ipv4'
    
    async def core_request(self, url, params, method='GET'):
        common_params = {
            "key": f"{AIWEN_API_KEY}",
            "channel": "py_mcp",
        }
        params.update(common_params)
        async with httpx.AsyncClient() as client:
            print(params)
            response = await client.get(url, params=params, timeout=10)
            # response.raise_for_status()
            # result = response.json()
            # print(result)
            logger.debug(response.text)
        return response.text
        if result.get("code") not in ("KeyExpired", "Success"):
            error_msg = result.get("msg", "unkown error")
            raise Exception(f"API response error: {error_msg}")
        return json.dumps(result, ensure_ascii=False)
        
    async def get_ip_location(self, ip):
        ip_type = self.check_ip_type(ip)
        if ip_type == 'ipv4':
            api_suffix = api_suffix_map.get(ip_type).get(IPV4_ACCURACY)
        else:
            api_suffix = api_suffix_map.get(ip_type).get(IPV6_ACCURACY)
        
        params = {
            "coordsys": "WGS84",
            "ip": ip
        }
        url = f"{self.api_host}/{api_suffix}"
        return await self.core_request(url, params, method="GET")

    async def get_ip_scene(self, ip):
        ip_type = self.check_ip_type(ip)
        if ip_type == "ipv4":
            api_suffix = "ip/info/v1/scene/"
        else:
            api_suffix = "ip/info/v1/ipv6Scene/"
        params = {
            "lang": "cn",
            "ip": ip
        }
        url = f"{self.api_host}/{api_suffix}"
        return await self.core_request(url, params, method="GET")
        
    async def get_ip_whois(self, ip):
        api_suffix = "ip/info/v1/ipWhois"
        params = dict(ip=ip)
        url = f"{self.api_host}/{api_suffix}"
        return await self.core_request(url, params, method="GET")
    
    async def get_as_whois(self, ip):
        api_suffix = "as/info/v1/asWhois"
        params = dict(ip=ip)
        url = f"{self.api_host}/{api_suffix}"
        return await self.core_request(url, params, method="GET")
    
    async def get_ip_host(self, ip):
        api_suffix = "ip/geo/v1/host/"
        params = dict(ip=ip)
        url = f"{self.api_host}/{api_suffix}"
        return await self.core_request(url, params, method="GET")
    
    async def get_ip_portrait(self, ip):
        api_suffix = "ip/info/v3/portrait/"
        params = dict(ip=ip)
        url = f"{self.api_host}/{api_suffix}"
        return await self.core_request(url, params, method="GET")
    
    async def get_ip_person(self, ip):
        api_suffix = "ip/info/v1/person/"
        params = dict(ip=ip)
        url = f"{self.api_host}/{api_suffix}"
        return await self.core_request(url, params, method="GET")
    
    async def get_ip_industry(self, ip):
        api_suffix = "ip/info/v1/industry/"
        params = dict(ip=ip)
        url = f"{self.api_host}/{api_suffix}"
        return await self.core_request(url, params, method="GET")

aw_client = AiwenClient(api_host=api_host, api_key=AIWEN_API_KEY)


@mcp.tool(description="IP定位 根据IP地址获取IP位置(支持城市、区县、街道三种精度)、经纬度、所属机构、运营商等信息")
async def aiwen_ip_location(
    ip: str = Field(description="IP地址 IPv4或IPv6")
    ):
    """
    accuracy: str = Field(description="定位精度: city(城市级)、district(区县级)、street(街道级)", 
                          default="city",)
    """
    try:
        resp = await aw_client.get_ip_location(ip)
        return resp
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
    except KeyError as e:
        raise Exception(f"Failed to parse reponse: {str(e)}") from e


# 获取用户当前访问网络的IP地址
@mcp.tool(description="获取当前网络IP地址 根据当前网络IP地址获取位置信息")
async def user_network_ip():
    try:
        # step1
        async with httpx.AsyncClient() as client:
            response = await client.get("https://www.ipuu.net/ipuu/user/getIP")
            print(response.text)
            # response.raise_for_status()
            result = response.json()
            ip = result.get("data")
            assert ip, "获取用户IP地址失败"

        # step2
        resp = await aw_client.get_ip_location(ip)
        return resp
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
    except KeyError as e:
        raise Exception(f"Failed to parse reponse: {str(e)}") from e

# 获取IP应用场景
@mcp.tool(description="根据IP地址获取IP使用场景 输出包括保留IP、未分配IP、组织机构、移动网络、家庭宽带、数据中心、企业专线、CDN、卫星通信、交换中心、Anycast等网络应用场景")
async def ip_usage_scene(ip: str = Field(description="IP地址 IPv4或IPv6")):
    try:
        resp = await aw_client.get_ip_scene(ip)
        return resp
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
    except KeyError as e:
        raise Exception(f"Failed to parse reponse: {str(e)}") from e

# 获取IP WHOIS
@mcp.tool(description="查询IP地址Whois注册信息 返回IP所属网段范围、所属机构名称、技术联系人、管理员等信息")
async def ip_whois_info(ip: str = Field(description="IP地址 IPv4")):
    try:
        resp = await aw_client.get_ip_whois(ip)
        return resp
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
    except KeyError as e:
        raise Exception(f"Failed to parse reponse: {str(e)}") from e


# 获取AS WHOIS
@mcp.tool(description="查询IP地址AS号(自治域号)信息 返回AS编号、AS名称、AS场景、AS所属的行业等")
async def ip_as_mapping(ip: str = Field(description="IP地址 IPv4")):
    try:
        resp = await aw_client.get_as_whois(ip)
        return resp
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
    except KeyError as e:
        raise Exception(f"Failed to parse reponse: {str(e)}") from e

# 宿主信息
@mcp.tool(description="查询IP地址的宿主信息 返回IP的自治域编号(AS Number)、AS名称、运营商、所属机构等归属属")
async def ip_host_info(ip: str = Field(description="IP地址 IPv4")):
    try:
        resp = await aw_client.get_ip_host(ip)
        return resp
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
    except KeyError as e:
        raise Exception(f"Failed to parse reponse: {str(e)}") from e
    
# 风险画像 
@mcp.tool(description="查询IP地址风险画像 识别VPN、代理、秒拨、数据中心、Tor节点、端口扫描、暴力破解等高风险行为,输出风险评分、分级结果、IP位置等信息")
async def ip_risk_portrait(ip: str = Field(description="IP地址 IPv4")):
    try:
        return await aw_client.get_ip_portrait(ip)
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
    except KeyError as e:
        raise Exception(f"Failed to parse reponse: {str(e)}") from e
    
# IP 真假人
@mcp.tool(description="根据IP地址判断访问者是否为真实用户或机器流量 返回真人概率(real_person_rate)、秒播概率(mb_rate)")
async def ip_identity_check(ip: str = Field(description="IP地址 IPv4")):
    try:
        return await aw_client.get_ip_person(ip)
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
    except KeyError as e:
        raise Exception(f"Failed to parse reponse: {str(e)}") from e
    
# IP 行业
@mcp.tool(description="IPv4行业 查询IP地址行业分类")
async def ip_industry_classify(ip: str = Field(description="IP地址 IPv4")):
    try:
        return await aw_client.get_ip_industry(ip)
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
    except KeyError as e:
        raise Exception(f"Failed to parse reponse: {str(e)}") from e