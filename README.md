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

### 2. 黄豆短剧 / 影视 去广告与 VIP 解锁

#### 📖 功能特性
- **开屏与弹窗拦截**：过滤各类开屏广告、暂停广告、信息流广告与推广 Banner。
- **解锁播放与权益**：自动改写账号权益为至尊 SVIP，解锁付费短剧与影视全集播放。
- **双向请求拦截与改写**：自动捕获并缓存播放请求上下文，解密改写加密响应体后重加密发还客户端。
- **高兼容性支持**：内置 TextEncoder / TextDecoder Polyfill 与 UTF-8 编解码引擎，完美兼容 Quantumult X、Loon、Surge、Shadowrocket 等主流代理环境。

#### 🚀 快捷订阅（Quantumult X）

复制以下链接直接添加到 Quantumult X 的远程重写引用中：

```text
https://raw.githubusercontent.com/Niklaus88/QuantumultX_rule/main/Rewrite/huangdou.snippet
```

#### 📱 配置步骤

1. 打开 **Quantumult X** -> 点击右下角 **风车图标（设置）**。
2. 找到 **「重写」** 分组 -> 点击 **「引用」**。
3. 点击右上角 **「+」** 添加远程引用：
   - **资源路径**：粘贴上述 `.snippet` 订阅链接
   - **名称**：可填 `黄豆短剧 VIP`
4. 保存后向右滑动该条目，点击 **「更新」**。
5. 确保 QX 首页的 **重写（Rewrite）** 与 **MitM** 功能均已开启。

---

## 📁 目录结构

```text
├── README.md                                 # 项目说明文档
├── Rewrite/
│   ├── huangdou.snippet                      # 黄豆短剧/影视 QX 远程重写订阅
│   ├── huangdou.js                           # 黄豆脚本（副本）
│   ├── Pinterest.snippet                     # Pinterest 去广告重写订阅
│   └── youtube_embed_referer.snippet         # Notion YouTube 修复重写订阅
└── Scripts/
    ├── huangdou.js                           # 黄豆短剧/影视 解密改写与增强脚本
    ├── Pinterest.js                          # Pinterest 信息流与推广过滤脚本
    └── youtube_embed_referer.js              # 请求头补全修复脚本
```

---

## ⚠️ 注意事项

- 本项目重写依赖 HTTPS 解密，请确保已在 Quantumult X 中正确生成、安装并**信任** MitM 根证书。
- 仅用于个人学习交流使用。
