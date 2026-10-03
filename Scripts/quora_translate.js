/**
 * @name Quora 自动翻译与免登录净化
 * @description 自动将 Quora 网页及移动端问答翻译为简体中文，支持 SPA 动态滚动翻译，解除强制登录遮罩与内容模糊
 * @author Niklaus88
 */

(function () {
    // 1. 处理响应头：放宽 CSP，允许注入 Google 翻译引擎脚本与样式
    if (typeof $response !== 'undefined' && typeof $response.headers !== 'undefined' && typeof $response.body === 'undefined') {
        const headers = $response.headers;
        const cspKeys = [
            'Content-Security-Policy',
            'content-security-policy',
            'Content-Security-Policy-Report-Only',
            'content-security-policy-report-only',
            'X-WebKit-CSP',
            'x-webkit-csp'
        ];
        cspKeys.forEach(k => delete headers[k]);
        $done({ headers });
        return;
    }

    // 2. 处理响应体：拦截 HTML 页面并注入翻译引擎与净化样式
    if (typeof $response !== 'undefined' && typeof $response.body !== 'undefined') {
        let body = $response.body;

        // 非 HTML 响应（如 API、静态资源等）直接跳过
        if (!body || body.indexOf('<html') === -1) {
            $done({});
            return;
        }

        const injectPayload = `
<!-- [QX] Quora Translate & Clean Injection -->
<style id="qx-quora-custom-style">
  /* 隐藏谷歌翻译原生浮动横幅、工具提示与多余高亮 */
  .goog-te-banner-frame.skiptranslate, iframe.goog-te-banner-frame { display: none !important; }
  body { top: 0px !important; }
  #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
  .goog-tooltip, .goog-tooltip:hover { display: none !important; }
  .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
  #google_translate_element { display: none !important; }

  /* Quora 净化：去除免登录遮罩、弹窗与毛玻璃虚化 */
  .signup_wall_wrapper, 
  div[id*="signup_wall"], 
  div[class*="signup_wall"],
  div[class*="BlockingWall"],
  div[class*="login_wall"],
  div[class*="LoginWall"] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
  div[style*="filter: blur"], div[style*="filter:blur"] {
    filter: none !important;
    -webkit-filter: none !important;
  }
  div[class*="qu-overflow--hidden"], body, html {
    overflow: visible !important;
  }

  /* 悬浮翻译控制球 */
  #qx-trans-toggle {
    position: fixed;
    right: 18px;
    bottom: 30px;
    z-index: 2147483647;
    background: linear-gradient(135deg, #b92b27, #1565c0);
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    padding: 9px 14px;
    border-radius: 24px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.25s ease;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", Roboto, sans-serif;
  }
  #qx-trans-toggle:active {
    transform: scale(0.92);
  }
</style>

<div id="google_translate_element"></div>

<script>
(function() {
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

  // 默认启用中译：如果未设置过 googtrans，默认设置为简体中文 /en/zh-CN
  var currentTrans = getCookie('googtrans');
  if (!currentTrans) {
    setTransCookie('/en/zh-CN');
  }

  // 渲染右下角悬浮控制按钮
  function setupUI() {
    if (document.getElementById('qx-trans-toggle')) return;
    var btn = document.createElement('div');
    btn.id = 'qx-trans-toggle';
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

  // 清除 Quora 免登录遮罩、弹窗与毛玻璃虚化
  function cleanQuoraWalls() {
    var blurred = document.querySelectorAll('[style*="filter: blur"], [style*="filter:blur"]');
    for (var i = 0; i < blurred.length; i++) {
      blurred[i].style.filter = 'none';
      blurred[i].style.webkitFilter = 'none';
    }
    var walls = document.querySelectorAll('.signup_wall_wrapper, [class*="signup_wall"], [class*="BlockingWall"], [class*="LoginWall"]');
    for (var j = 0; j < walls.length; j++) {
      walls[j].style.display = 'none';
    }
    // 解除页面滚动锁定
    var locked = document.querySelectorAll('[class*="qu-overflow--hidden"]');
    for (var k = 0; k < locked.length; k++) {
      locked[k].style.overflow = 'visible';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setupUI();
      cleanQuoraWalls();
    });
  } else {
    setupUI();
    cleanQuoraWalls();
  }

  // 监听 SPA 动态滚动加载，实时清洗遮罩
  try {
    var observer = new MutationObserver(function() {
      cleanQuoraWalls();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } catch(e) {}
})();

// Google 翻译引擎初始化入口
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
<script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
<!-- [QX End] Quora Translate & Clean Injection -->
`;

        if (body.indexOf('</body>') !== -1) {
            body = body.replace('</body>', injectPayload + '</body>');
        } else if (body.indexOf('</html>') !== -1) {
            body = body.replace('</html>', injectPayload + '</html>');
        } else {
            body += injectPayload;
        }

        $done({ body });
        return;
    }

    $done({});
})();
