# Quantumult X Rules & Scripts

本仓库用于存放个人自定义的 Quantumult X 分流规则、重写配置（Rewrite Snippet）与自动化增强脚本。

---

## 🛠️ 项目列表

### 1. 修复 iOS Notion 内嵌 YouTube 视频报 153 错误

#### 📖 问题背景
在 iOS 端使用 Notion App 时，内嵌的 YouTube 视频播放器常出现 **「视频播放器配置错误（错误 153）」**。
- **原因**：iOS 原生 WKWebView 跨应用发起内嵌请求时缺失了合法的网页来源（`Referer` / `Origin`），被 YouTube 嵌入式安全校验机制拦截。
- **原理**：利用 Quantumult X 重写机制，在请求发往 YouTube 嵌入端点前，自动补齐缺失的 `Referer: https://www.notion.so/` 请求头，无感恢复正常播放。

#### 🚀 快捷订阅（Quantumult X）

复制以下链接直接添加到 Quantumult X 的远程重写引用中：

```text
https://raw.githubusercontent.com/Niklaus88/QuantumultX_rule/main/Rewrite/youtube_embed_referer.snippet
```

#### 📱 配置步骤

1. 打开 **Quantumult X** -> 点击右下角 **风车图标（设置）**。
2. 找到 **「重写」** 分组 -> 点击 **「引用」**。
3. 点击右上角 **「+」** 添加远程引用：
   - **资源路径**：粘贴上述 `.snippet` 订阅链接
   - **名称**：可填 `Notion YouTube 修复`
4. 保存后向右滑动该条目，点击 **「更新」**。
5. 确保 QX 首页的 **重写（Rewrite）** 与 **MitM** 功能均已开启。
6. 上滑彻底退出 Notion App 并重新打开即可。

---

### 2. Quora 网页端与移动端自动翻译及体验增强

#### 📖 问题背景与机制说明
- **背景**：Quora 官方未提供简体中文语言支持，且移动端网页存在强制登录弹窗拦截与文本毛玻璃虚化（Signup Wall）。
- **与 Reddit 翻译的区别**：Reddit 脚本是通过向官方接口注入 `x-reddit-translations` 请求头触发其**服务端**内置机器翻译；而 Quora 官方没有此类服务端翻译接口，且 iOS 原生 App 开启了严格的 SSL Pinning（证书绑定）。
- **实现原理**：针对 Quora 网页端（Safari / 移动端浏览器 / PWA 轻量客户端），利用 Quantumult X 重写机制：
  1. 放宽 CSP（内容安全策略）限制，允许跨域翻译脚本执行；
  2. 自动注入 Google 翻译引擎，页面加载即**全自动无感翻译为简体中文**；
  3. 深度适配 **SPA 动态滚动**，异步加载的新回答与评论均可实时自动翻译；
  4. 自动去除**免登录遮罩、弹窗与毛玻璃虚化**，解锁沉浸式全文阅读；
  5. 页面右下角贴心集成**「中文 / 原文」悬浮切换球**，随时一键还原英文原文对比。

#### 🚀 快捷订阅（Quantumult X）

复制以下链接直接添加到 Quantumult X 的远程重写引用中：

```text
https://raw.githubusercontent.com/Niklaus88/QuantumultX_rule/main/Rewrite/quora_translate.snippet
```

#### 📱 配置步骤

1. 打开 **Quantumult X** -> 点击右下角 **风车图标（设置）**。
2. 找到 **「重写」** 分组 -> 点击 **「引用」**。
3. 点击右上角 **「+」** 添加远程引用：
   - **资源路径**：粘贴上述 `.snippet` 订阅链接
   - **名称**：可填 `Quora 自动翻译`
4. 保存后向右滑动该条目，点击 **「更新」**。
5. 确保 QX 首页的 **重写（Rewrite）** 与 **MitM** 功能均已开启。
6. 使用 Safari 或移动端浏览器访问 [Quora](https://www.quora.com) 即可自动享受中文翻译与无干扰阅读。

---

## 📁 目录结构

```text
├── README.md                                 # 项目说明文档
├── Rewrite/
│   ├── huangdou.snippet                      # 黄豆去广告与 VIP 解锁
│   ├── Pinterest.snippet                     # Pinterest 去广告与追踪拦截
│   ├── quora_translate.snippet               # Quora 自动翻译与免登录阅读
│   └── youtube_embed_referer.snippet         # Notion YouTube 视频修复
└── Scripts/
    ├── huangdou.js                           # 黄豆业务逻辑解密与修改脚本
    ├── Pinterest.js                          # Pinterest 信息流净化脚本
    ├── quora_translate.js                    # Quora 翻译引擎注入与 DOM 净化脚本
    └── youtube_embed_referer.js              # 请求头补全修复脚本
```

---

## ⚠️ 注意事项

- 本项目重写依赖 HTTPS 解密，请确保已在 Quantumult X 中正确生成、安装并**信任** MitM 根证书。
- Quora 自动翻译推荐在 Safari、移动端浏览器或主屏幕 PWA 下使用；Quora iOS 原生 App 由于系统证书绑定（SSL Pinning）机制，MitM 解密在非越狱环境下会被 App 拦截。
- 仅用于个人学习交流使用。
