if ($response.statusCode != 200) {
    $done({ title: "请求失败", subtitle: "HTTP状态码: " + $response.statusCode, ip: "0.0.0.0" });
} else {
    var obj = {};
    try {
        obj = JSON.parse($response.body);
    } catch (e) {
        $done({ title: "解析失败", subtitle: "返回数据异常", ip: "0.0.0.0" });
    }

    if (obj["status"] && obj["status"] != "success") {
        $done({ title: "接口报错", subtitle: String($response.body).slice(0, 50), ip: "0.0.0.0" });
    } else {
        var cc = (obj["countryCode"] || "").toUpperCase();
        var flag = "🌐";
        if (cc.length == 2) {
            flag = String.fromCodePoint(cc.charCodeAt(0) + 127397, cc.charCodeAt(1) + 127397);
        }
        
        var location = obj["city"] || obj["country"] || "未知地区";
        var ipAddress = obj["query"] || "无IP";
        var asn = obj["as"] ? obj["as"].split(" ")[0] : "未知ASN";

        var type = "住宅";
        if (obj["hosting"]) type = "机房";
        else if (obj["mobile"]) type = "流量卡";
        else if (obj["proxy"]) type = "代理";

        // ISP 中文翻译字典
        var ispName = obj["isp"] || "";
        function getChineseISP(name) {
            if (!name) return "";
            var n = name.toUpperCase();
            
            // 新增及原有宽带与云服务商映射
            if (n.includes("CHUNGHWA") || n.includes("HINET")) return "中华电信";
            if (n.includes("COGNETCLOUD") || n.includes("COGNET")) return "Cognet";
            if (n.includes("AKARI")) return "Akari";
            if (n.includes("BRITISH TELECOMMUNICATIONS")) return "英国电信";
            if (n.includes("DMIT")) return "DMIT";
            if (n.includes("HKT") || n.includes("PCCW")) return "香港电讯";
            if (n.includes("HKBN")) return "香港宽频";
            if (n.includes("CMCC") || n.includes("CHINAMOBILE")) return "中国移动";
            if (n.includes("CHINANET") || n.includes("CHINATELECOM")) return "中国电信";
            if (n.includes("UNICOM")) return "中国联通";
            if (n.includes("ALIBABA") || n.includes("ALIPAY")) return "阿里云";
            if (n.includes("TENCENT")) return "腾讯云";
            if (n.includes("GOOGLE")) return "谷歌云";
            if (n.includes("AMAZON") || n.includes("AWS")) return "亚马逊";
            if (n.includes("MICROSOFT") || n.includes("AZURE")) return "微软";
            if (n.includes("ORACLE")) return "甲骨文";
            if (n.includes("CLOUDFLARE")) return "CF";
            if (n.includes("IT7") || n.includes("BANDWAGON")) return "搬瓦工";
            
                        // 未收录的 ISP 截取前 8 个字符兜底
            return n.length > 8 ? n.substring(0, 8) : name;
        }

        var isp = ispName ? getChineseISP(ispName) : "未知ISP";

        $done({
            title: flag + " " + type + "  " + ipAddress,
            subtitle: location + "  " + asn + "  " + isp,
            ip: ipAddress
        });
    }
}
