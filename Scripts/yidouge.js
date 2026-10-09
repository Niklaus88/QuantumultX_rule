/**
 * @name 一抖阁 完整视频解锁与体验增强脚本
 * @description 适用于 Quantumult X，解除一抖阁 5 分钟试看与每日看片次数限制，拦截广告与弹窗，注入原生增强播放器（支持倍速、画中画、键盘快捷键与原画 MP4 下载）
 * @author Niklaus88
 */

(function () {
    const url = (typeof $request !== 'undefined' ? $request.url : '') || '';
    const method = ((typeof $request !== 'undefined' ? $request.method : '') || 'GET').toUpperCase();

    // 静态资源与非视频页面快速放行
    if (
        method !== 'GET' ||
        !/\/video\//.test(url) ||
        /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|json|mp4)(\?|$)/i.test(url)
    ) {
        $done({});
        return;
    }

    // ==========================================
    // Phase 1: 请求头阶段 (script-request-header)
    // 强制移除 br (Brotli) 压缩，改为 gzip，使 QX 能正常解码并篡改 HTML
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
    // 移除 CSP 安全策略头，并预置年龄验证 Cookie
    // ==========================================
    if (typeof $response !== 'undefined' && typeof $response.headers !== 'undefined' && typeof $response.body === 'undefined') {
        let headers = $response.headers || {};
        let ctKey = Object.keys(headers).find(k => k.toLowerCase() === 'content-type');
        let ct = ctKey ? headers[ctKey] : '';

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

        // 预置年龄确认 Cookie
        const cookieKey = Object.keys(headers).find(k => k.toLowerCase() === 'set-cookie') || 'Set-Cookie';
        const ageCookie = 'gv_age_verified=1; Max-Age=31536000; Path=/; SameSite=Lax';
        const existing = headers[cookieKey];
        if (!existing) {
            headers[cookieKey] = ageCookie;
        } else if (Array.isArray(existing)) {
            headers[cookieKey].push(ageCookie);
        } else {
            headers[cookieKey] = existing + '\n' + ageCookie;
        }

        $done({ headers });
        return;
    }

    // ==========================================
    // Phase 3: 响应体阶段 (script-response-body)
    // 篡改 HTML：解除试看限制、清除弹窗、注入播放器核心
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

        // 1. 移除内联 CSP meta 标签
        body = body.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');

        // 2. 清除服务端输出的 300 秒试看限制属性，防止原站自带脚本启动 5 分钟断播定时器
        body = body.replace(/data-guest-preview-seconds="\d+"/gi, 'data-guest-preview-seconds="0"');

        // 3. 清理原站静态结构中的试看提示与遮罩
        body = body.replace(/<div[^>]*class="[^"]*watch-status[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
        body = body.replace(/<div[^>]*class="[^"]*guest-preview-overlay[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
        body = body.replace(/<div[^>]*class="[^"]*single-video-vip-promo[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

        // 4. 构造注入代码
        const injectPayload = `
<!-- [QX] Yidouge Video Unlocker & Enhanced Player -->
<style id="ydg-unlocked-style">
    .watch-status,
    .watch-status--guest,
    .gv-preview-limit-notice,
    .guest-limit-notice,
    .guest-preview-overlay,
    [data-guest-preview-overlay],
    .video-ended-overlay,
    [data-video-ended-overlay],
    .gv-native-recovery,
    .gv-player-loading,
    [data-video-loading],
    [data-age-gate],
    .gv-age-gate {
        display: none !important;
    }

    body.gv-preview-modal-open,
    html.gv-age-gate-pending,
    body.gv-age-gate-pending {
        overflow: auto !important;
    }

    .single-video-vip-promo,
    [data-vip-promo],
    .vip-promo,
    .video-sidebar--friend-links,
    .video-sidebar--contact,
    .video-sidebar--authors,
    .video-sidebar--vip-entry,
    .site-footer__notice {
        display: none !important;
    }

    .ydg-player-container {
        position: relative;
        width: 100%;
        margin: 0 0 16px 0;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
    }

    .ydg-video-box {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        background: #000;
        overflow: hidden;
    }

    .ydg-custom-video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: #000;
        display: block;
        outline: none;
    }

    .ydg-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 14px;
        background: linear-gradient(180deg, #181b28 0%, #10121a 100%);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        color: #e2e8f0;
        font-size: 13px;
        user-select: none;
    }

    .ydg-toolbar-left,
    .ydg-toolbar-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .ydg-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 11px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        text-decoration: none !important;
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.06);
        color: #e2e8f0;
        transition: all 0.18s ease;
    }

    .ydg-btn:hover {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.35);
        color: #fff;
    }

    .ydg-btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border-color: #3b82f6;
        color: #fff !important;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
    }

    .ydg-speeds {
        display: flex;
        align-items: center;
        gap: 2px;
        background: rgba(0, 0, 0, 0.35);
        padding: 3px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .ydg-speed-btn {
        padding: 3px 6px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: #94a3b8;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.15s;
    }

    .ydg-speed-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
    }

    .ydg-speed-btn.active {
        background: #3b82f6;
        color: #fff;
        font-weight: 600;
    }

    .ydg-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 7px;
        background: rgba(16, 185, 129, 0.14);
        border: 1px solid rgba(16, 185, 129, 0.35);
        border-radius: 4px;
        color: #34d399;
        font-size: 11px;
        font-weight: 500;
    }

    .ydg-shortcuts-hint {
        color: #64748b;
        font-size: 11px;
        cursor: help;
    }

    .ydg-error-panel {
        position: absolute;
        inset: 0;
        background: rgba(10, 10, 15, 0.92);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: #f87171;
        font-size: 13px;
        z-index: 10;
        padding: 20px;
        text-align: center;
    }

    @media (max-width: 640px) {
        .ydg-toolbar {
            padding: 8px 10px;
            gap: 6px;
        }
        .ydg-toolbar-left,
        .ydg-toolbar-right {
            width: 100%;
            justify-content: space-between;
        }
        .ydg-shortcuts-hint {
            display: none;
        }
    }
</style>
<script id="ydg-unlocked-script">
(function() {
    'use strict';
    var R2_BASE = 'https://r2.yidouge.com/changsp/';

    function skipAgeGate() {
        try {
            localStorage.setItem('gv_age_verified', '1');
            sessionStorage.setItem('gv_age_verified', '1');
        } catch (e) {}
        try {
            document.cookie = 'gv_age_verified=1; Max-Age=31536000; Path=/; SameSite=Lax';
        } catch (e) {}
        if (document.documentElement) document.documentElement.classList.remove('gv-age-gate-pending');
        if (document.body) document.body.classList.remove('gv-age-gate-pending');
        document.querySelectorAll('[data-age-gate], .gv-age-gate').forEach(function(el) {
            if (el.remove) el.remove(); else el.style.display = 'none';
        });
    }

    function cleanStorage() {
        try {
            var keysToRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && ((k.indexOf('gv_') !== -1 && k !== 'gv_age_verified' && k !== 'gv_autoplay_next') ||
                    k.indexOf('preview') !== -1 || k.indexOf('count') !== -1 || k.indexOf('watch') !== -1)) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
        } catch (e) {}
    }

    function getVideoInfo() {
        var videoUrl = '';
        var posterUrl = '';
        var title = '';
        var source = '';

        var wrap = document.querySelector('[data-video-player-wrap], .single-video__player');
        if (wrap) {
            posterUrl = wrap.dataset.videoPoster || wrap.getAttribute('data-video-poster') || '';
            var rawUrl = wrap.dataset.videoUrl || wrap.getAttribute('data-video-url');
            if (rawUrl) {
                videoUrl = rawUrl;
                source = 'wrap[data-video-url]';
            }
        }

        var h1 = document.querySelector('h1');
        if (h1 && h1.textContent.trim()) {
            title = h1.textContent.trim();
        } else {
            var ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle && ogTitle.content) {
                title = ogTitle.content.replace(/\\s*[-–|].*$/, '').trim();
            } else if (document.title) {
                title = document.title.replace(/\\s*[-–|].*$/, '').trim();
            }
        }

        if (!videoUrl) {
            var scripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (var i = 0; i < scripts.length; i++) {
                try {
                    var data = JSON.parse(scripts[i].textContent);
                    var extractUrl = function(obj) {
                        if (!obj) return null;
                        if (obj.contentUrl) return obj;
                        if (Array.isArray(obj['@graph'])) {
                            for (var j = 0; j < obj['@graph'].length; j++) {
                                if (obj['@graph'][j].contentUrl) return obj['@graph'][j];
                            }
                        }
                        return null;
                    };
                    var item = extractUrl(data);
                    if (item) {
                        videoUrl = item.contentUrl;
                        if (!posterUrl && item.thumbnailUrl) {
                            posterUrl = Array.isArray(item.thumbnailUrl) ? item.thumbnailUrl[0] : item.thumbnailUrl;
                        }
                        if (!title && item.name) {
                            title = item.name.replace(/\\s*[-–|].*$/, '').trim();
                        }
                        source = 'JSON-LD VideoObject';
                        break;
                    }
                } catch (e) {}
            }
        }

        if (!videoUrl && document.documentElement) {
            var html = document.documentElement.innerHTML;
            var match = html.match(/https?:\\/\\/[a-z0-9.-]*r2\\.yidouge\\.[a-z0-9]+\\/changsp\\/[^"'\\s<>&]+\\.mp4/i);
            if (match) {
                videoUrl = match[0].replace(/\\\\u002F/gi, '/').replace(/\\\\/g, '');
                source = 'HTML源代码正则匹配';
            }
        }

        if (!videoUrl && title) {
            var cleanTitle = title.replace(/[《》]/g, '').trim();
            if (cleanTitle) {
                videoUrl = R2_BASE + encodeURI(cleanTitle) + '.mp4';
                source = '视频真实标题构造';
            }
        }

        if (!videoUrl) {
            var path = window.location.pathname;
            var slug = path.replace(/^\\/video\\//, '').replace(/\\/$/, '');
            if (slug) {
                var decoded = decodeURIComponent(slug);
                videoUrl = R2_BASE + encodeURI(decoded) + '.mp4';
                source = 'URL slug 构造';
            }
        }

        if (videoUrl) {
            return {
                url: videoUrl,
                poster: posterUrl,
                title: title,
                source: source
            };
        }
        return null;
    }

    function createPlayer(wrap, info) {
        if (!wrap || wrap.querySelector('#ydg-unlocked-video')) return;

        wrap.removeAttribute('data-guest-preview-seconds');
        wrap.removeAttribute('data-video-player-wrap');
        wrap.removeAttribute('data-video-url');

        if (wrap.goonArtplayer && typeof wrap.goonArtplayer.destroy === 'function') {
            try { wrap.goonArtplayer.destroy(); } catch (e) {}
        }
        wrap.innerHTML = '';
        wrap.classList.add('is-artplayer-ready');

        var container = document.createElement('div');
        container.className = 'ydg-player-container';

        var videoBox = document.createElement('div');
        videoBox.className = 'ydg-video-box';

        var video = document.createElement('video');
        video.id = 'ydg-unlocked-video';
        video.className = 'ydg-custom-video';
        video.controls = true;
        video.autoplay = false;
        video.preload = 'metadata';
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        if (info.poster) video.poster = info.poster;

        var sourceEl = document.createElement('source');
        sourceEl.src = info.url;
        sourceEl.type = 'video/mp4';
        video.appendChild(sourceEl);

        var savedSpeed = parseFloat(localStorage.getItem('ydg_last_speed')) || 1.0;
        video.playbackRate = savedSpeed;

        var progressKey = 'ydg_progress_' + info.url;
        video.addEventListener('loadedmetadata', function() {
            try {
                var savedTime = parseFloat(sessionStorage.getItem(progressKey));
                if (savedTime && savedTime > 5 && savedTime < video.duration - 10) {
                    video.currentTime = savedTime;
                }
            } catch (e) {}
        });

        var saveTimer = null;
        video.addEventListener('timeupdate', function() {
            if (!saveTimer) {
                saveTimer = setTimeout(function() {
                    saveTimer = null;
                    try {
                        if (video.currentTime > 5) {
                            sessionStorage.setItem(progressKey, video.currentTime);
                        }
                    } catch (e) {}
                }, 2000);
            }
        });

        var errorPanel = document.createElement('div');
        errorPanel.className = 'ydg-error-panel';
        errorPanel.style.display = 'none';
        errorPanel.innerHTML = '<div>⚠️ 视频流加载中断或地址失效</div>' +
            '<div style="display:flex;gap:10px;">' +
            '<button type="button" class="ydg-btn ydg-btn-primary" id="ydg-retry-btn">🔄 重新加载</button>' +
            '<a class="ydg-btn" href="' + info.url + '" target="_blank">🔗 浏览器中打开</a>' +
            '</div>';

        errorPanel.querySelector('#ydg-retry-btn').addEventListener('click', function() {
            errorPanel.style.display = 'none';
            video.load();
            video.play().catch(function() {});
        });

        video.addEventListener('error', function() {
            errorPanel.style.display = 'flex';
        });

        videoBox.appendChild(video);
        videoBox.appendChild(errorPanel);

        var toolbar = document.createElement('div');
        toolbar.className = 'ydg-toolbar';

        var toolbarLeft = document.createElement('div');
        toolbarLeft.className = 'ydg-toolbar-left';

        var downloadBtn = document.createElement('a');
        downloadBtn.className = 'ydg-btn ydg-btn-primary';
        downloadBtn.href = info.url;
        var filename = (info.title ? info.title.replace(/[\\\\/:*?"<>|]/g, '') : '一抖阁视频') + '.mp4';
        downloadBtn.download = filename;
        downloadBtn.target = '_blank';
        downloadBtn.rel = 'noopener noreferrer';
        downloadBtn.innerHTML = '⬇ 下载完整视频';
        downloadBtn.title = '直接从高速 CDN 下载原画 MP4';

        var copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'ydg-btn';
        copyBtn.innerHTML = '📋 复制直链';
        copyBtn.title = '复制视频直链到剪贴板，可粘贴至迅雷/IDM/浏览器直接下载';
        copyBtn.addEventListener('click', function() {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(info.url).then(function() {
                    var originalHtml = copyBtn.innerHTML;
                    copyBtn.innerHTML = '✅ 已复制直链';
                    copyBtn.style.borderColor = '#10b981';
                    copyBtn.style.color = '#34d399';
                    setTimeout(function() {
                        copyBtn.innerHTML = originalHtml;
                        copyBtn.style.borderColor = '';
                        copyBtn.style.color = '';
                    }, 2000);
                }).catch(function() {
                    window.prompt('请长按复制视频直链：', info.url);
                });
            } else {
                window.prompt('请长按复制视频直链：', info.url);
            }
        });

        var pipBtn = document.createElement('button');
        pipBtn.type = 'button';
        pipBtn.className = 'ydg-btn';
        pipBtn.innerHTML = '📺 画中画';
        pipBtn.title = '进入画中画悬浮窗播放模式';
        pipBtn.addEventListener('click', function() {
            try {
                if (document.pictureInPictureElement) {
                    document.exitPictureInPicture();
                } else if (video.requestPictureInPicture) {
                    video.requestPictureInPicture();
                } else if (video.webkitSetPresentationMode) {
                    video.webkitSetPresentationMode('picture-in-picture');
                }
            } catch (e) {}
        });

        toolbarLeft.appendChild(downloadBtn);
        toolbarLeft.appendChild(copyBtn);
        toolbarLeft.appendChild(pipBtn);

        var toolbarRight = document.createElement('div');
        toolbarRight.className = 'ydg-toolbar-right';

        var speedBox = document.createElement('div');
        speedBox.className = 'ydg-speeds';
        var speeds = [0.75, 1.0, 1.25, 1.5, 2.0, 3.0];
        var speedButtons = [];

        speeds.forEach(function(rate) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ydg-speed-btn';
            btn.textContent = rate + 'x';
            if (rate === savedSpeed) btn.classList.add('active');
            btn.addEventListener('click', function() {
                video.playbackRate = rate;
                speedButtons.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                localStorage.setItem('ydg_last_speed', rate);
            });
            speedBox.appendChild(btn);
            speedButtons.push(btn);
        });

        var badge = document.createElement('span');
        badge.className = 'ydg-badge';
        badge.innerHTML = '🎬 完整版已解锁';

        var shortcutsHint = document.createElement('span');
        shortcutsHint.className = 'ydg-shortcuts-hint';
        shortcutsHint.title = '空格: 播放/暂停\\n←/→: 快退/快进 5s (按住Shift: 10s)\\n↑/↓: 调节音量\\nF: 全屏切换\\nM: 静音切换';
        shortcutsHint.textContent = '⌨ 快捷键';

        toolbarRight.appendChild(speedBox);
        toolbarRight.appendChild(badge);
        toolbarRight.appendChild(shortcutsHint);

        toolbar.appendChild(toolbarLeft);
        toolbar.appendChild(toolbarRight);

        container.appendChild(videoBox);
        container.appendChild(toolbar);
        wrap.appendChild(container);

        document.querySelectorAll('[data-guest-preview-overlay], [data-video-ended-overlay]').forEach(function(el) { el.remove(); });
        if (document.body) document.body.classList.remove('gv-preview-modal-open');
    }

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            var targetTag = (e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '');
            if (targetTag === 'input' || targetTag === 'textarea' || (e.target && e.target.isContentEditable)) {
                return;
            }

            var video = document.getElementById('ydg-unlocked-video');
            if (!video) return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    if (video.paused) video.play(); else video.pause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - (e.shiftKey ? 10 : 5));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration || Infinity, video.currentTime + (e.shiftKey ? 10 : 5));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    video.volume = Math.min(1, video.volume + 0.1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    video.volume = Math.max(0, video.volume - 0.1);
                    break;
                case 'KeyF':
                    e.preventDefault();
                    if (document.fullscreenElement) {
                        document.exitFullscreen().catch(function() {});
                    } else {
                        var box = video.closest('.ydg-video-box') || video;
                        if (box.requestFullscreen) {
                            box.requestFullscreen().catch(function() {});
                        } else if (video.webkitEnterFullscreen) {
                            video.webkitEnterFullscreen();
                        }
                    }
                    break;
                case 'KeyM':
                    e.preventDefault();
                    video.muted = !video.muted;
                    break;
            }
        });
    }

    function trySetup() {
        skipAgeGate();
        if (document.getElementById('ydg-unlocked-video')) return true;

        var info = getVideoInfo();
        if (!info) return false;

        var wrap = document.querySelector('[data-video-player-wrap], .single-video__player');
        if (!wrap) {
            var main = document.querySelector('.single-video') ||
                       document.querySelector('main') ||
                       document.querySelector('.site-main');
            if (main) {
                wrap = document.createElement('div');
                wrap.className = 'single-video__player';
                var title = document.querySelector('h1') || main.firstChild;
                if (title && title.parentNode) {
                    title.parentNode.insertBefore(wrap, title);
                } else {
                    main.insertBefore(wrap, main.firstChild);
                }
            }
        }

        if (wrap) {
            createPlayer(wrap, info);
            return true;
        }
        return false;
    }

    function init() {
        skipAgeGate();
        cleanStorage();

        if (trySetup()) return;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                skipAgeGate();
                trySetup();
            });
        }

        var observer = new MutationObserver(function() {
            skipAgeGate();
            if (trySetup()) {
                observer.disconnect();
            }
        });

        var targetNode = document.documentElement || document;
        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });

        var attempts = 0;
        var timer = setInterval(function() {
            attempts++;
            skipAgeGate();
            if (trySetup() || attempts >= 15) {
                clearInterval(timer);
                observer.disconnect();
            }
        }, 400);
    }

    var lastUrl = location.href;
    function checkUrlChange() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            var existing = document.querySelector('.ydg-player-container');
            if (existing) existing.remove();
            setTimeout(init, 100);
        }
    }
    window.addEventListener('popstate', checkUrlChange);

    setupKeyboardShortcuts();
    init();
})();
</script>
`;

        // 5. 注入到 HTML 文档中
        if (/<\/head>/i.test(body)) {
            body = body.replace(/<\/head>/i, injectPayload + '\n</head>');
        } else if (/<\/body>/i.test(body)) {
            body = body.replace(/<\/body>/i, injectPayload + '\n</body>');
        } else {
            body += injectPayload;
        }

        $done({ body });
        return;
    }

    $done({});
})();
