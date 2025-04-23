# 埃文IP定位 MCP Server

## 介绍
[埃文科技](https://www.ipplus360.com/) 是全球IP地址高精准实时定位技术领航者 全球网络空间地图大数据服务提供商

埃文科技IP定位API已全面兼容MCP协议

MCP Server for the Aiwen IP Location API

## 工具介绍

1. IP定位 `aiwen_ip_location`
- 描述：根据请求的IP地址，返回该IP地址的详细信息，包括国家、省份、城市、运营商、使用者、经纬度等。
- 参数：
  - `ip`：IP地址，必填IPv4

- 输出示例

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


## 快速使用

### 获取API key
通过aiwen官网 获取api key： https://mall.ipplus360.com/pros/IPVFourGeoAPI


