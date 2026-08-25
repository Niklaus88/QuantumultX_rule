/**
 * @name 修复 iOS Notion 等 App 内嵌 YouTube 视频 153 错误
 * @description 补全缺失的 Referer / Origin 请求头，解决移动端 WebView 播放器配置校验失败问题
 * @author Niklaus88
 */

let headers = $request.headers;
let referer = headers['Referer'] || headers['referer'];

// 当缺少 Referer 或为本地 App 容器协议时，补全为 Notion 网页来源
if (!referer || referer.includes('capacitor://') || referer.includes('notion://') || referer.includes('localhost')) {
    headers['Referer'] = 'https://www.notion.so/';
    headers['Origin'] = 'https://www.notion.so';
}

$done({ headers });
