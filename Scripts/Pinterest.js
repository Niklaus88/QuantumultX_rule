/**
 * @name Pinterest 去广告与内容净化脚本
 * @description 适用于 Quantumult X，过滤 Pinterest 客户端与网页端信息流中的推广内容（Promoted / Sponsored Pins）及广告模块
 * @author Niklaus88
 */

let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);

        const isAd = (item) => {
            if (!item || typeof item !== "object") return false;
            
            // 1. 官方明确的广告与推广布尔标识
            if (item.is_promoted === true || item.promoted === true || item.has_been_promoted === true) return true;
            if (item.is_shopping_ad === true || item.is_downstream_promotion === true) return true;
            
            // 2. 广告属性与投放数据
            if (item.ad_data || item.ad_title || item.advertiser_name || item.advertiser_id || item.promoted_lead_app) return true;
            if (item.oneTapPromotedPin || item.ad_tracking || item.promoted_pin_info || item.promoter) return true;
            if (item.ad_match_reason || item.sponsorship || item.promoted_is_catalog_carousel_ad) return true;
            
            // 3. 广告特有的哈希型 pin_id（自然 Pin 均为纯数字 ID，广告 Pin 为超过 30 位的 Base64 字符）
            if (typeof item.id === "string" && item.id.length > 30 && !/^\d+$/.test(item.id)) return true;
            
            // 4. 文案线索
            if (typeof item.grid_description === "string" && item.grid_description.toLowerCase().includes("sponsored")) return true;
            if (item.module && typeof item.module.name === "string" && item.module.name.toLowerCase().includes("promoted")) return true;
            
            return false;
        };

        const filterArray = (arr) => {
            if (!Array.isArray(arr)) return arr;
            return arr.filter(item => !isAd(item));
        };

        // 处理单 Pin 详情请求命中广告时置空
        if (obj.data && !Array.isArray(obj.data) && isAd(obj.data)) {
            obj.data = {};
        }

        // 处理信息流与列表接口
        if (Array.isArray(obj.data)) {
            obj.data = filterArray(obj.data);
        } else if (obj.data && Array.isArray(obj.data.items)) {
            obj.data.items = filterArray(obj.data.items);
        } else if (obj.data && Array.isArray(obj.data.pins)) {
            obj.data.pins = filterArray(obj.data.pins);
        } else if (obj.resource_response && Array.isArray(obj.resource_response.data)) {
            obj.resource_response.data = filterArray(obj.resource_response.data);
        } else if (obj.resource_response && obj.resource_response.data && Array.isArray(obj.resource_response.data.results)) {
            obj.resource_response.data.results = filterArray(obj.resource_response.data.results);
        } else if (Array.isArray(obj.items)) {
            obj.items = filterArray(obj.items);
        }

        $done({ body: JSON.stringify(obj) });
    } catch (e) {
        $done({});
    }
} else {
    $done({});
}
