# 埃文IP定位 MCP Server

## 介绍
[埃文科技](https://www.ipplus360.com/) 是全球IP地址高精准实时定位技术领航者 全球网络空间地图大数据服务提供商

埃文科技IP定位API已全面兼容MCP协议

MCP Server for the Aiwen IP Location API

## 工具介绍

1. IP定位 `aiwen_ip_location`
    - 描述：IP定位 根据IP地址获取IP位置(支持城市、区县、街道三种精度)、经纬度、所属机构、运营商、精度等信息。
    - 参数： `ip`：IP地址，支持IPv4、IPv6
    - 输出：位置信息，大洲`continent`,国家`country` 所属机构`owner`,运营商`isp`,邮编`zipcode`,时区`timezone`，精度`accuracy`，国家编码`areacode`,AS号`asnumber`,纬度`lat`,经度`lng`,省份`prov`,城市`city`,区县`district`,街道级地址`address`

> 1. IP定位产品分三个定位精度：通过环境变量配置(见下方环境变量配置)
> 2. 城市级：最大定位精度返回到城市 city
> 3. 区县级：最大定位精度返回到区县 district
> 4. 街道级：最大定位精度返回到街道 address 

2. 获取当前网络IP地址和位置信息 `user_network_ip`
    - 描述：获取当前网络IP地址和IP位置信息(支持城市、区县、街道三种精度),支持IPv4和IPv6
    - 参数 无
    - 输出结果 同上

3. IP应用场景 `ip_usage_scene`
    - 描述：IP应用场景 根据IP地址获取IP应用场景 输出包括保留IP、未分配IP、组织机构、移动网络、家庭宽带、数据中心、企业专线、CDN、卫星通信、交换中心、Anycast等网络应用场景
    - 参数： `ip`：IP地址，支持IPv4、IPv6
    - 输出：应用场景 `scene`

4. IP Whois `ip_whois_info`
    - 描述：whois信息 根据IP地址查询Whois注册信息 获取IP所属网段范围、所属机构名称、技术联系人、管理员等信息
    - 参数： `ip`：IP地址，支持IPv4
    - 输出：Whois注册信息，`netname`,`status`,`owner`,`techinfo`,`admininfo`等

5. AS Whois `ip_as_mapping`
    - 描述：查询IP地址AS号(自治域号)信息
    - 参数： `ip`：IP地址，支持IPv4
    - 输出：AS 相关信息，`asname`,`asn`,`allocated`，`type`,`industry`等

6. IP宿主信息 `ip_host_info`
    - 描述：IP宿主信息 根据IP地址查询IP的自治域编号(AS Number)、AS名称、运营商、所属机构等归属属性
    - 参数： `ip`：IP地址，支持IPv4
    - 输出：AS 相关信息，`asname`,`asnumber`,`isp`，`owner`等

7. IP风险画像 `ip_risk_portrait`
    - 描述：IP风险画像 根据IP地址获取IP风险画像 识别VPN、代理、秒拨、数据中心、Tor节点、端口扫描、暴力破解等高风险行为,输出风险评分、分级结果、IP位置等信息
    - 参数：`ip`：IP地址，支持IPv4
    - 输出：风险标签`tag`, 风险等级`level`, 风险分数`score`, 位置场景信息`continent`,`country`,`prov`,`city`,`scene`等

8. IP真假人 `ip_identity_check`
    - 描述：IP真假人 根据IP地址判断访问者是否为真实用户或机器流量 返回真人概率(real_person_rate)、秒播概率(mb_rate)
    - 参数：`ip`：IP地址，支持IPv4
    - 输出：真人概率`real_person_rate`, 秒播概率`mb_rate`, 自治域编号`asnumber`,运营商`isp`

9. IPv4行业 `ip_industry_classify`
    - 描述：IPv4行业 查询IP地址行业分类
    - 参数：`ip`：IP地址，支持IPv4
    - 输出：IPv4 所属行业`industry`

> 接口的详细返回数据，参考官方的API文档

## 快速使用

### 获取API KEY
通过埃文科技官网 [获取KEY](https://mall.ipplus360.com/pros/IPVFourGeoAPI?source=mcp)

### 环境变量配置

环境变量说明：
1. **`AIWEN_API_KEY`** 产品的API KEY
2. **`IPV4_ACCURACY`**（默认值：`city`）用于配置IPv4定位精度，根据所购API版本选择一个值：  
可选值：`city`（城市级）、`district`（区级）、`street`（街道级）
3. **`IPV6_ACCURACY`**（默认值：`city`）用于配置IPv6定位精度，根据所购API版本选择一个值：  
可选值：`city`（城市级）、`district`（区级）、`street`（街道级）


### MCP HOST中配置使用
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
                "AIWEN_API_KEY": "xxxxxx",
                "IPV4_ACCURACY": "city",
                "IPV6_ACCURACY": "city",
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
                "AIWEN_API_KEY": "xxxxxx",
                "IPV4_ACCURACY": "city",
                "IPV6_ACCURACY": "city",
            }
        }
    }
}
```

## 应用场景

- 需要快速查询 IP 地址地理位置的应用  
- 网络安全和访问控制 ，验证IP来源
- IP地理位置相关的数据分析，科学研究
- 获取 IP 场景数据的应用
- 获取 IP whois信息的应用
- 获取 IP AS信息的应用
- 获取 IP 宿主信息的应用
- 获取 IP 风险画像的应用
- 获取 IP 真假人信息的应用
- 获取 IP 行业信息的应用