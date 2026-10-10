/**
 * 中国联通 (10010) Cookie / Token 获取脚本
 *
 * 适配平台: Quantumult X (向下兼容 Surge / Loon / Shadowrocket)
 * 项目仓库: https://github.com/Niklaus88/QuantumultX_rule
 *
 * 功能特性:
 * 1. 深度适配最新版「中国联通 APP」，截取首页余额与余量查询接口 (queryUserInfoSeven 等) 中的 Cookie 与手机号；
 * 2. 截取自动登录/凭据续期接口 (onLine.htm) 中的 token_online、appId 与 Set-Cookie；
 * 3. 智能 Cookie 合并与清洗，自动保留核心鉴权参数；
 * 4. 多重存储规范兼容:
 *    - BoxJS YaYa 规范: YaYa_10010、@YaYa_10010.cookie (适配经典版及 LS 版 Scriptable 小组件)
 *    - BoxJS V4 规范: ChinaUnicom、@ChinaUnicom.10010v4.cookie (适配 ChinaUnicom_2024 等现代小组件)
 *    - 本地直取规范: 10010_cookie、10010_phone、10010_token
 * 5. 智能防刷与变更提醒: Cookie 发生变动或首次获取时弹窗，未变动时静默日志更新。
 */

const SCRIPT_NAME = '中国联通';
const NOTIFY_INTERVAL = 3600 * 1000; // 相同 Cookie 提醒间隔 (1 小时)

// 环境与存储适配层
const isQX = typeof $prefs !== 'undefined';
const isSurge = typeof $httpClient !== 'undefined' && typeof $utils !== 'undefined';
const isLoon = typeof $loon !== 'undefined';

function getVal(key) {
  if (isQX) return $prefs.valueForKey(key);
  if (typeof $persistentStore !== 'undefined') return $persistentStore.read(key);
  return null;
}

function setVal(key, val) {
  if (isQX) return $prefs.setValueForKey(String(val), key);
  if (typeof $persistentStore !== 'undefined') return $persistentStore.write(String(val), key);
  return false;
}

function notify(title, subtitle, message) {
  if (isQX) return $notify(title, subtitle, message);
  if (typeof $notification !== 'undefined') return $notification.post(title, subtitle, message);
}

function log(msg) {
  console.log(`[${SCRIPT_NAME}] ${msg}`);
}

// 统一获取 Header (忽略大小写)
function getHeader(headers, name) {
  if (!headers || typeof headers !== 'object') return '';
  const target = name.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === target) {
      return headers[k];
    }
  }
  return '';
}

// 安全解析 JSON
function safeJson(str, fallback = {}) {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

// 手机号脱敏
function maskPhone(phone) {
  if (!phone) return '';
  const str = String(phone).trim();
  if (/^1\d{10}$/.test(str)) {
    return str.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  return str.length > 7 ? `${str.slice(0, 3)}****${str.slice(-4)}` : str;
}

// 合并与清洗 Cookies
function mergeCookies(existing = '', incoming = '') {
  const map = {};
  const parse = (cookieStr) => {
    if (!cookieStr) return;
    const parts = Array.isArray(cookieStr) ? cookieStr : String(cookieStr).split(';');
    for (const part of parts) {
      const idx = part.indexOf('=');
      if (idx > 0) {
        const k = part.substring(0, idx).trim();
        const v = part.substring(idx + 1).trim();
        const lowerK = k.toLowerCase();
        // 排除 Set-Cookie 的标准属性指令
        if (
          [
            'domain',
            'path',
            'expires',
            'max-age',
            'samesite',
            'secure',
            'httponly',
            'priority',
          ].includes(lowerK)
        ) {
          continue;
        }
        if (k && v !== '') {
          map[k] = v;
        }
      }
    }
  };
  parse(existing);
  parse(incoming);
  return Object.keys(map)
    .map((k) => `${k}=${map[k]}`)
    .join('; ');
}

// 从 URL 中提取查询参数
function getQueryParam(url, paramName) {
  if (!url) return '';
  const reg = new RegExp(`[?&]${paramName}=([^&#]*)`, 'i');
  const res = url.match(reg);
  return res ? decodeURIComponent(res[1]) : '';
}

// 保存所有格式的凭据
function saveCredentials({ cookie, phone, tokenOnline, appId }) {
  if (!cookie && !tokenOnline) return false;

  const oldCookie = getVal('@ChinaUnicom.10010v4.cookie') || getVal('10010_cookie') || '';
  const oldPhone = getVal('10010_phone') || '';
  const lastNotifyTime = parseInt(getVal('10010_last_notify_time') || '0', 10);
  const now = Date.now();

  const finalPhone = phone || oldPhone;
  const isCookieChanged = cookie && cookie !== oldCookie;
  const shouldNotify = isCookieChanged || now - lastNotifyTime > NOTIFY_INTERVAL;

  // 1. 基础独立键
  if (cookie) setVal('10010_cookie', cookie);
  if (finalPhone) setVal('10010_phone', finalPhone);
  if (tokenOnline) setVal('10010_token', tokenOnline);
  if (appId) setVal('10010_appid', appId);

  // 2. BoxJS YaYa 规范 (@YaYa_10010.cookie / YaYa_10010)
  if (cookie) {
    setVal('@YaYa_10010.cookie', cookie);
    const yayaData = safeJson(getVal('YaYa_10010'), {});
    yayaData.cookie = cookie;
    if (finalPhone) yayaData.phone = finalPhone;
    yayaData.updatedAt = new Date().toISOString();
    setVal('YaYa_10010', JSON.stringify(yayaData));
  }

  // 3. BoxJS V4 规范 (@ChinaUnicom.10010v4.cookie / ChinaUnicom)
  if (cookie) {
    setVal('@ChinaUnicom.10010v4.cookie', cookie);
  }
  const rootStore = safeJson(getVal('ChinaUnicom'), {});
  if (!rootStore['10010v4'] || typeof rootStore['10010v4'] !== 'object') {
    rootStore['10010v4'] = {};
  }
  if (cookie) rootStore['10010v4'].cookie = cookie;
  if (tokenOnline) rootStore['10010v4'].token_online = tokenOnline;
  if (appId) rootStore['10010v4'].appId = appId;
  if (finalPhone) rootStore['10010v4'].phone = finalPhone;
  rootStore['10010v4'].updatedAt = new Date().toISOString();
  setVal('ChinaUnicom', JSON.stringify(rootStore));

  log(
    `已成功持久化联通凭据 (Cookie 长度: ${cookie ? cookie.length : 0}, 账号: ${maskPhone(
      finalPhone
    ) || '未知'}, token_online: ${tokenOnline ? '已更新' : '沿用'})`
  );

  // 4. 发送系统通知
  if (shouldNotify) {
    setVal('10010_last_notify_time', String(now));
    const subtitle = isCookieChanged ? 'Cookie 写入成功 🎉' : 'Cookie 凭据正常有效 ✅';
    const msg = [
      finalPhone ? `📱 账号: ${maskPhone(finalPhone)}` : null,
      tokenOnline ? '🔑 Token: 自动续登令牌已同步' : null,
      '📦 兼容: 已写入 BoxJS 及 Scriptable 小组件存储',
    ]
      .filter(Boolean)
      .join('\n');
    notify(SCRIPT_NAME, subtitle, msg);
  } else {
    log('Cookie 未发生变动且在静默周期内，跳过系统弹窗提醒。');
  }

  return true;
}

// 主入口流程
(function main() {
  try {
    const req = typeof $request !== 'undefined' ? $request : null;
    const resp = typeof $response !== 'undefined' ? $response : null;

    if (!req) {
      log('未检测到请求对象，脚本退出。');
      $done({});
      return;
    }

    const url = req.url || '';
    const reqHeaders = req.headers || {};
    const reqCookie = getHeader(reqHeaders, 'cookie');

    // 场景 A: 首页余额查询接口 (queryUserInfoSeven / queryUserInfo)
    if (/home\/queryUserInfo/i.test(url) || /smartwisdomCommon/i.test(url)) {
      log('捕获到首页余额查询请求...');
      if (reqCookie) {
        // 从 URL 提取手机号 (desmobiel 或 desmobile)
        let phone = getQueryParam(url, 'desmobiel') || getQueryParam(url, 'desmobile');
        if (!phone) {
          const cookiePhoneMatch = reqCookie.match(/c_mobile=([^;]+)/i);
          if (cookiePhoneMatch) phone = cookiePhoneMatch[1];
        }

        const oldCookie = getVal('@ChinaUnicom.10010v4.cookie') || getVal('10010_cookie') || '';
        const mergedCookie = mergeCookies(oldCookie, reqCookie);

        saveCredentials({
          cookie: mergedCookie,
          phone: phone,
        });
      } else {
        log('查询请求中未携带 Cookie 标头。');
      }
    }

    // 场景 B: 自动登录 / 凭据续期接口 (onLine.htm)
    if (/mobileService\/onLine\.htm/i.test(url)) {
      log('捕获到自动登录 / 续期接口...');
      let tokenOnline = '';
      let appId = getQueryParam(url, 'appId');
      let respCookie = '';

      // 解析响应体 (需 script-response-body)
      if (resp && resp.body) {
        const bodyJson = safeJson(resp.body, null);
        if (bodyJson && typeof bodyJson === 'object') {
          tokenOnline =
            bodyJson.token_online ||
            (bodyJson.data && bodyJson.data.token_online) ||
            '';
          if (!appId) {
            appId = bodyJson.appId || (bodyJson.data && bodyJson.data.appId) || '';
          }
        }
      }

      // 解析响应头 Set-Cookie
      if (resp && resp.headers) {
        respCookie = getHeader(resp.headers, 'set-cookie');
      }

      const oldCookie = getVal('@ChinaUnicom.10010v4.cookie') || getVal('10010_cookie') || '';
      const finalCookie = mergeCookies(oldCookie, mergeCookies(reqCookie, respCookie));

      saveCredentials({
        cookie: finalCookie,
        tokenOnline: tokenOnline,
        appId: appId,
      });
    }
  } catch (err) {
    log(`执行发生异常: ${err.message || err}`);
  } finally {
    $done({});
  }
})();
