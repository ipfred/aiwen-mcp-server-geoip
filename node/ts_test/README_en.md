# Aiwen IP Location MCP Server

## Introduction
[AiWen Tech](https://www.ipplus360.com/) is the global leader in high-precision real-time positioning technology for IP addresses and a global cyberspace map big data service provider

MCP Server for the Aiwen IP Location API

## tools

1. IP location `aiwen_ip_location`
- Description: Based on the requested IP address, return detailed information of the IP address, including country, province, city, IPS, user, longitude and latitude, etc.
- 参数：
  - `ip`：IP address，Required IPv4

- Output example

```json
{
  "code": "Success",
  "data": {
    "continent": "亚洲",
    "country": "中国",
    "owner": "中国电信",
    "isp": "中国电信",
    "zipcode": "510000",
    "timezone": "UTC+8",
    "accuracy": "城市",
    "source": "数据挖掘",
    "areacode": "CN",
    "adcode": "440100",
    "asnumber": "4134",
    "lat": "23.116548",
    "lng": "113.295827",
    "radius": "87.3469",
    "prov": "广东省",
    "city": "广州市"
  },
  "charge": true,
  "msg": "查询成功",
  "ip": "202.97.89.109",
  "coordsys": "WGS84"
}
```


## Quick Use

### get API key
get api key： https://mall.ipplus360.com/pros/IPVFourGeoAPI

### MCP HOST step up
#### cursor
```json
{
    "mcpServers": {
        "aiwen-iplocation": {
            "command": "npx",
            "args": [
                "-y",
                "aiwen-mcp-server-geoip"
            ],
            "env": {
                "AIWEN_API_KEY": "xxxxxx"
            }
        }
    }
}
```
#### vscode
```json
{
    "mcpServers": {
        "aiwen-iplocation": {
            "command": "npx",
            "args": [
                "-y",
                "aiwen-mcp-server-geoip"
            ],
            "env": {
                "AIWEN_API_KEY": "xxxxxx"
            }
        }
    }
}
```
