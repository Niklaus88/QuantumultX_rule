/**
 * Spotify QX Device Capabilities Rewrite
 * 项目仓库: https://github.com/Niklaus88/QuantumultX_rule
 *
 * 功能说明:
 * 修改客户端 /device-capabilities/v1/capabilities 响应体，
 * 赋予设备端 Premium 生效许可与 HiFi 支持选项，并提供安全容错防护。
 */
try {
  let bodyStr = $response.body;
  if (!bodyStr) {
    $done({});
  } else {
    let body = JSON.parse(bodyStr);
    if (body && typeof body === 'object') {
      body.effective_license = 'premium';
      if (!body.supports_hifi || typeof body.supports_hifi !== 'object') {
        body.supports_hifi = {};
      }
      body.supports_hifi.fully_supported = true;
      body.supports_hifi.user_eligible = true;
      $done({ body: JSON.stringify(body) });
    } else {
      $done({});
    }
  }
} catch (e) {
  console.log('[Spotify Capabilities] 解析或处理异常:', e.message || e);
  $done({});
}
