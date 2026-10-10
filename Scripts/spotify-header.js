/**
 * Spotify QX Header Rewrite
 * 项目仓库: https://github.com/Niklaus88/QuantumultX_rule
 *
 * 功能说明:
 * 移除 ETag 缓存响应头 (If-None-Match)，强制 Spotify 边缘服务器返回 200 OK 完整数据体，
 * 避免因 304 Not Modified 导致 QX 响应体重写脚本失效。
 */
let headers = $request.headers || {};
if (headers) {
  delete headers['If-None-Match'];
  delete headers['if-none-match'];
}
$done({ headers });
