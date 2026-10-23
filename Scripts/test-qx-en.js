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

        var ispName = obj["isp"] || "";
        function formatISP(name) {
            if (!name) return "";
            var n = name.toUpperCase();
            
            if (n.includes("CHUNGHWA") || n.includes("HINET")) return "Chunghwa";
            if (n.includes("COGNETCLOUD") || n.includes("COGNET")) return "Cognet";
            if (n.includes("AKARI")) return "Akari";
            if (n.includes("BRITISH TELECOMMUNICATIONS")) return "BT";
            if (n.includes("DMIT")) return "DMIT";
            if (n.includes("HKT") || n.includes("PCCW")) return "HKT";
            if (n.includes("HKBN")) return "HKBN";
            if (n.includes("CMCC") || n.includes("CHINAMOBILE")) return "CMCC";
            if (n.includes("CHINANET") || n.includes("CHINATELECOM")) return "Telecom";
            if (n.includes("UNICOM")) return "Unicom";
            if (n.includes("ALIBABA") || n.includes("ALIPAY")) return "Alibaba";
            if (n.includes("TENCENT")) return "Tencent";
            if (n.includes("GOOGLE")) return "Google";
            if (n.includes("AMAZON") || n.includes("AWS")) return "AWS";
            if (n.includes("MICROSOFT") || n.includes("AZURE")) return "Azure";
            if (n.includes("ORACLE")) return "Oracle";
            if (n.includes("CLOUDFLARE")) return "Cloudflare";
            if (n.includes("IT7") || n.includes("BANDWAGON")) return "Bandwagon";
            
            return name.length > 12 ? name.substring(0, 12) : name;
        }

        var isp = ispName ? formatISP(ispName) : "Unknown ISP";

        $done({
            title: flag + " " + type + "  " + ipAddress,
            subtitle: location + "  " + asn + "  " + isp,
            ip: ipAddress
        });
    }
}
