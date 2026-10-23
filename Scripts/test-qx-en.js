if ($response.statusCode != 200) {
    $done({ title: "Failed", subtitle: "HTTP Status: " + $response.statusCode, ip: "0.0.0.0" });
} else {
    var obj = {};
    try {
        obj = JSON.parse($response.body);
    } catch (e) {
        $done({ title: "Error", subtitle: "Invalid JSON response", ip: "0.0.0.0" });
    }

    if (obj["status"] && obj["status"] != "success") {
        $done({ title: "API Error", subtitle: String($response.body).slice(0, 50), ip: "0.0.0.0" });
    } else {
        var cc = (obj["countryCode"] || "").toUpperCase();
        var flag = "🌐";
        if (cc.length == 2) {
            flag = String.fromCodePoint(cc.charCodeAt(0) + 127397, cc.charCodeAt(1) + 127397);
        }
        
        var location = obj["city"] || obj["country"] || "Unknown";
        var ipAddress = obj["query"] || "No IP";
        var asn = obj["as"] ? obj["as"].split(" ")[0] : "Unknown ASN";

        var type = "Residential";
        if (obj["hosting"]) type = "Datacenter";
        else if (obj["mobile"]) type = "Cellular";
        else if (obj["proxy"]) type = "Proxy";

        // 去掉冗余 ISP，第一行专注展示国旗 + 地理位置 + ASN；第二行展示类型 + 完整IP
        $done({
            title: flag + " " + location + "  " + asn,
            subtitle: type + "  " + ipAddress,
            ip: ipAddress
        });
    }
}
