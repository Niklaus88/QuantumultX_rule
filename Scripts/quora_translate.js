/**
 * @name Quora 自动翻译与体验净化
 * @description 自动将 Quora 网页及添加到主屏幕的 PWA 翻译为简体中文，实时拦截“下载App”弹窗遮罩，去除免登录限制与内容模糊
 * @author Niklaus88
 */

(function () {
    // ==========================================
    // Phase 1: 请求头阶段 (script-request-header)
    // 强制移除 br (Brotli) 压缩，改用 gzip，使 QX 能解压并正常注入 HTML
    // ==========================================
    if (typeof $request !== 'undefined' && typeof $response === 'undefined') {
        let headers = $request.headers || {};
        let aeKey = Object.keys(headers).find(k => k.toLowerCase() === 'accept-encoding');
        if (aeKey) {
            let ae = headers[aeKey] || '';
            // 剥离 br，强制走 gzip
            ae = ae.replace(/\bbr,?\s*/gi, '').replace(/,\s*br\b/gi, '').trim();
            if (!ae) ae = 'gzip, deflate';
            headers[aeKey] = ae;
        }
        $done({ headers });
        return;
    }

    // ==========================================
    // Phase 2: 响应头阶段 (script-response-header)
    // 剥离 CSP 安全策略头，确保内联脚本与 Google 翻译引擎能顺利执行
    // ==========================================
    if (typeof $response !== 'undefined' && typeof $response.headers !== 'undefined' && typeof $response.body === 'undefined') {
        let headers = $response.headers || {};
        const cspKeys = [
            'content-security-policy',
            'content-security-policy-report-only',
            'x-webkit-csp',
            'x-content-security-policy'
        ];
        Object.keys(headers).forEach(k => {
            if (cspKeys.includes(k.toLowerCase())) {
                delete headers[k];
            }
        });
        $done({ headers });
        return;
    }

    // ==========================================
    // Phase 3: 响应体阶段 (script-response-body)
    // 注入自动翻译引擎、拦截“下载App”弹窗、解除免登录虚化
    // ==========================================
    if (typeof $response !== 'undefined' && typeof $response.body !== 'undefined') {
        let body = $response.body;

        // 非 200 响应或非 HTML 格式（如接口返回的 JSON、图片等）直接放行
        if ($response.status && $response.status !== 200 && $response.status !== 206) {
            $done({});
            return;
        }

        if (!body || typeof body !== 'string' || !/<html/i.test(body)) {
            $done({});
            return;
        }

        // 1. 移除页面内部可能内嵌的 <meta http-equiv="Content-Security-Policy"...>
        body = body.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');

        // 2. 构造注入代码（CSS 拦截 + JS 自动清理与翻译）
        const injectPayload = `
<!-- [QX] Quora Translate & App-Popup Killer -->
<style id="qx-quora-inject-style">
  /* 1. 强力屏蔽“下载App / There is more in the app”全屏遮罩与弹窗 */
  div[role="dialog"]:has(*:is(h1,h2,h3,div,p):contains("There is more in the app")),
  div[class*="backdrop"], div[class*="Backdrop"],
  div[class*="blocking_wall"], div[class*="BlockingWall"],
  div[class*="signup_wall"], div[class*="SignupWall"],
  .signup_wall_wrapper {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    z-index: -9999 !important;
  }

  /* 2. 解除页面滚动锁定与文字模糊 */
  html, body, div[class*="qu-overflow--hidden"] {
    overflow: visible !important;
    position: static !important;
    filter: none !important;
    -webkit-filter: none !important;
  }
  div[style*="filter: blur"], div[style*="filter:blur"] {
    filter: none !important;
    -webkit-filter: none !important;
  }

  /* 3. 隐藏 Google 翻译原生横幅与多余标记，保持页面美观 */
  .goog-te-banner-frame.skiptranslate, iframe.goog-te-banner-frame { display: none !important; }
  body { top: 0px !important; }
  #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
  .goog-tooltip, .goog-tooltip:hover { display: none !important; }
  .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
  #google_translate_element { display: none !important; }

  /* 4. 悬浮双语切换球 */
  #qx-trans-btn {
    position: fixed !important;
    right: 18px !important;
    bottom: 30px !important;
    z-index: 2147483647 !important;
    background: linear-gradient(135deg, #b92b27, #1565c0) !important;
    color: #ffffff !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    line-height: 1 !important;
    padding: 9px 14px !important;
    border-radius: 24px !important;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35) !important;
    cursor: pointer !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    transition: all 0.2s ease !important;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", Roboto, sans-serif !important;
  }
  #qx-trans-btn:active {
    transform: scale(0.92) !important;
  }
</style>

<div id="google_translate_element"></div>

<script>
(function() {
  // 设置自动翻译为中文的 Cookie
  var host = window.location.hostname;
  var domainParts = host.split('.');
  var rootDomain = domainParts.length >= 2 ? domainParts.slice(-2).join('.') : host;

  function getCookie(name) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? decodeURIComponent(v[2]) : null;
  }

  function setTransCookie(val) {
    document.cookie = 'googtrans=' + val + '; path=/; domain=.' + rootDomain;
    document.cookie = 'googtrans=' + val + '; path=/; domain=' + host;
    document.cookie = 'googtrans=' + val + '; path=/';
  }

  // 默认启用中文翻译 /en/zh-CN
  if (!getCookie('googtrans')) {
    setTransCookie('/en/zh-CN');
  }

  // 渲染右下角切换按钮
  function renderUI() {
    if (document.getElementById('qx-trans-btn')) return;
    var btn = document.createElement('div');
    btn.id = 'qx-trans-btn';
    var isZh = (getCookie('googtrans') || '').indexOf('zh-CN') !== -1;
    btn.innerHTML = '<span style="font-size:14px;">🌐</span> ' + (isZh ? '中文' : '原文');
    btn.onclick = function() {
      if (isZh) {
        setTransCookie('/en/en');
      } else {
        setTransCookie('/en/zh-CN');
      }
      window.location.reload();
    };
    if (document.body) {
      document.body.appendChild(btn);
    }
  }

  // 强力清除“下载 App (There is more in the app)”弹窗与去登录遮罩
  function killPopupsAndClean() {
    // 1. 查找并自动点击 "Stay in browser"
    var allElements = document.querySelectorAll('button, a, span, div, p');
    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      if (el.textContent && el.textContent.trim() === 'Stay in browser') {
        el.click();
      }
    }

    // 2. 查找包含 "There is more in the app" 的弹窗并彻底移除
    var dialogs = document.querySelectorAll('div[role="dialog"], div[class*="Modal"], div[class*="modal"], div[class*="overlay"]');
    for (var j = 0; j < dialogs.length; j++) {
      var d = dialogs[j];
      if (d.textContent && (d.textContent.indexOf('There is more in the app') !== -1 || d.textContent.indexOf('Download the free app') !== -1 || d.textContent.indexOf('Stay in browser') !== -1)) {
        d.style.setProperty('display', 'none', 'important');
        d.remove();
      }
    }

    // 3. 移除遮罩背景层
    var backdrops = document.querySelectorAll('div[class*="backdrop"], div[class*="Backdrop"]');
    for (var k = 0; k < backdrops.length; k++) {
      backdrops[k].style.setProperty('display', 'none', 'important');
      backdrops[k].remove();
    }

    // 4. 清除内容模糊与恢复页面滚动
    var blurred = document.querySelectorAll('[style*="filter: blur"], [style*="filter:blur"]');
    for (var m = 0; m < blurred.length; m++) {
      blurred[m].style.filter = 'none';
      blurred[m].style.webkitFilter = 'none';
    }
    document.body.style.setProperty('overflow', 'visible', 'important');
    document.documentElement.style.setProperty('overflow', 'visible', 'important');
  }

  // 执行初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      renderUI();
      killPopupsAndClean();
    });
  } else {
    renderUI();
    killPopupsAndClean();
  }

  // 监听动态变化（滚动加载回答 / 异步弹出弹窗）
  try {
    var observer = new MutationObserver(function() {
      killPopupsAndClean();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } catch(e) {}

  // 动态引入 Google 翻译脚本并配置备用源
  var script = document.createElement('script');
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.onerror = function() {
    var fallback = document.createElement('script');
    fallback.src = 'https://translate.googleapis.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.head.appendChild(fallback);
  };
  document.head.appendChild(script);
})();

// Google 翻译引擎入口
window.googleTranslateElementInit = function() {
  if (window.google && window.google.translate) {
    new google.translate.TranslateElement({
      pageLanguage: 'en',
      includedLanguages: 'zh-CN,en',
      autoDisplay: false
    }, 'google_translate_element');
  }
};
</script>
<!-- [QX End] Quora Translate & App-Popup Killer -->
`;

        // 优先注入到 <head> 顶部，确保样式与去弹窗脚本在网页渲染第一时间执行
        if (/<head[^>]*>/i.test(body)) {
            body = body.replace(/<head[^>]*>/i, '$&' + injectPayload);
        } else if (/<\/head>/i.test(body)) {
            body = body.replace(/<\/head>/i, injectPayload + '</head>');
        } else if (/<body>/i.test(body)) {
            body = body.replace(/<body>/i, '<body>' + injectPayload);
        } else {
            body = injectPayload + body;
        }

        $done({ body });
        return;
    }

    $done({});
})();
