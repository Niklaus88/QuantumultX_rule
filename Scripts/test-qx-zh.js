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

        // 去掉冗余 ISP，第一行专注展示国旗 + 地理位置 + ASN；第二行展示类型 + 完整IP
        $done({
            title: flag + " " + location + "  " + asn,
            subtitle: type + "  " + ipAddress,
            ip: ipAddress
        });
    }
}
