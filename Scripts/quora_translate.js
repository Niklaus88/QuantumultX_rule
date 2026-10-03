/**
 * @name Quora 自动翻译与体验净化
 * @description 自动将 Quora 网页及添加到主屏幕的 PWA 翻译为简体中文，实时拦截“下载App”弹窗遮罩，去除免登录限制与内容模糊
 * @author Niklaus88
 */

(function () {
    const url = (typeof $request !== 'undefined' ? $request.url : '') || '';
    const method = ((typeof $request !== 'undefined' ? $request.method : '') || 'GET').toUpperCase();

    // ==========================================
    // 全局防线：绝对不碰任何 POST 请求、API、GraphQL 与登录鉴权通道
    // 确保登录流程与 Session Cookies 100% 原始传输，杜绝“Something went wrong”
    // ==========================================
    if (
        method !== 'GET' ||
        url.includes('/graphql') ||
        url.includes('/api/') ||
        url.includes('/_/') ||
        url.includes('/login') ||
        url.includes('/signup') ||
        url.includes('/oauth') ||
        /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|json)(\?|$)/i.test(url)
    ) {
        $done({});
        return;
    }

    // ==========================================
    // Phase 1: 请求头阶段 (script-request-header)
    // 强制移除 br (Brotli) 压缩，改用 gzip，使 QX 能解压并正常注入 HTML
    // ==========================================
    if (typeof $request !== 'undefined' && typeof $response === 'undefined') {
        let headers = $request.headers || {};
        let aeKey = Object.keys(headers).find(k => k.toLowerCase() === 'accept-encoding');
        if (aeKey) {
            let ae = headers[aeKey] || '';
            ae = ae.replace(/\bbr,?\s*/gi, '').replace(/,\s*br\b/gi, '').trim();
            if (!ae) ae = 'gzip, deflate';
            headers[aeKey] = ae;
        }
        $done({ headers });
        return;
    }

    // ==========================================
    // Phase 2: 响应头阶段 (script-response-header)
    // 仅针对 HTML 网页放行 CSP 安全策略头，保护登录凭据与多重 Set-Cookie 头
    // ==========================================
    if (typeof $response !== 'undefined' && typeof $response.headers !== 'undefined' && typeof $response.body === 'undefined') {
        let headers = $response.headers || {};
        let ctKey = Object.keys(headers).find(k => k.toLowerCase() === 'content-type');
        let ct = ctKey ? headers[ctKey] : '';

        // 仅在明确是 HTML 响应时处理 CSP，其余任何响应一概不碰
        if (!ct || !ct.toLowerCase().includes('text/html')) {
            $done({});
            return;
        }

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
  /* 1. 强力屏蔽“下载App / There is more in the app”专属导流弹窗 */
  div[role="dialog"]:has(*:is(h1,h2,h3,div,p):contains("There is more in the app")),
  div[class*="blocking_wall"], div[class*="BlockingWall"],
  div[class*="signup_wall"], div[class*="SignupWall"],
  .signup_wall_wrapper {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    z-index: -9999 !important;
  }

  /* 2. 解除正文内容模糊与页面滚动锁定 */
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

  /* 3. 严格保护所有表单、输入框、登录弹窗免受翻译修改，防止 React 渲染崩溃 */
  form, input, textarea, [class*="login"], [class*="Login"], [class*="signup"], [class*="Signup"], .notranslate {
    translate: no !important;
  }

  /* 4. 隐藏 Google 翻译原生横幅与多余标记 */
  .goog-te-banner-frame.skiptranslate, iframe.goog-te-banner-frame { display: none !important; }
  body { top: 0px !important; }
  #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
  .goog-tooltip, .goog-tooltip:hover { display: none !important; }
  .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
  #google_translate_element { display: none !important; }

  /* 5. 悬浮双语切换球 */
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

  // 精准仅清理“下载 App (There is more in the app)”弹窗，严禁误触登录框与 remove() 节点
  function cleanAppBannerAndProtectForms() {
    // 1. 为表单及登录组件添加 notranslate，保护 React 虚拟 DOM 不被翻译篡改
    var forms = document.querySelectorAll('form, input, textarea, [class*="login"], [class*="Login"], [class*="signup"], [class*="Signup"]');
    for (var f = 0; f < forms.length; f++) {
      forms[f].classList.add('notranslate');
      forms[f].setAttribute('translate', 'no');
    }

    // 2. 只有当页面确实弹出了“There is more in the app”时才精准处理该弹窗
    var headings = document.querySelectorAll('h1, h2, h3, div, p');
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      if (h.textContent && h.textContent.trim() === 'There is more in the app') {
        var dialog = h.closest('div[role="dialog"], div[class*="Modal"], div[class*="modal"]');
        if (dialog) {
          // 仅隐藏，绝不使用 node.remove()，避免破坏 React 内部 Fiber 结构导致报错
          dialog.style.setProperty('display', 'none', 'important');
          dialog.style.setProperty('opacity', '0', 'important');
          dialog.style.setProperty('pointer-events', 'none', 'important');

          var links = dialog.querySelectorAll('a, button, span');
          for (var j = 0; j < links.length; j++) {
            if (links[j].textContent && links[j].textContent.trim() === 'Stay in browser') {
              links[j].click();
              break;
            }
          }
        }
        break;
      }
    }

    // 3. 解除阅读模糊
    var blurred = document.querySelectorAll('[style*="filter: blur"], [style*="filter:blur"]');
    for (var m = 0; m < blurred.length; m++) {
      blurred[m].style.filter = 'none';
      blurred[m].style.webkitFilter = 'none';
    }
  }

  // 执行初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      renderUI();
      cleanAppBannerAndProtectForms();
    });
  } else {
    renderUI();
    cleanAppBannerAndProtectForms();
  }

  // 监听动态变化（滚动加载回答 / 异步弹窗）
  try {
    var observer = new MutationObserver(function() {
      cleanAppBannerAndProtectForms();
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

        // 优先注入到 <head> 顶部，确保样式与脚本第一时间生效
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
