/**
 * Spotify QX Platform Rewrite
 * 项目仓库: https://github.com/Niklaus88/QuantumultX_rule
 *
 * 功能说明:
 * 将客户端请求 URL 中的 platform=iphone 动态替换为 platform=ipad，
 * 借由 Spotify 官方对平板端（iPad）免费用户的开放策略，解除手机端的强制随机播放与歌单/专辑点歌限制。
 */
let url = $request.url || '';
if (url.includes('com:443')) {
  url = url.replace(/com:443/, 'com');
}
if (/platform=iphone/i.test(url)) {
  url = url.replace(/platform=iphone/gi, 'platform=ipad');
}
$done({ url });
