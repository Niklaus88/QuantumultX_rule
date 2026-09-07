# Quantumult X Rules & Scripts

本仓库用于存放个人自定义的 Quantumult X 分流规则、重写配置（Rewrite Snippet）与自动化增强脚本。

---

## 🛠️ 项目列表

### 1. Quantumult X 懒人完美配置（QX-lrpz.conf）

开箱即用的标准懒人配置模板，兼顾国内极致高速直连与海外隐私防泄露：
- **流媒体秒开**：放行 UDP 443（KQUIC），彻底解决微信视频号、朋友圈视频、国内大厂流媒体卡顿转圈问题。
- **隐私防泄露**：保留 WebRTC 专属 STUN 端口拦截（`3478, 19302-19309`），杜绝真实本地公网 IP 泄露。
- **DNS 闭环架构**：开启 `no-system` 防劫持，同时通过精准指定 DoH 引导解析（Bootstrap），彻底解决断网重连与冷启动死锁。
- **防DNS-WebRTC泄露**：本地分流置顶主流隐私检测站（BrowserLeaks、IPPure、IPLeak 等）强制走代理，配合 DoH 强加密与 STUN 阻断，实现主流测试站 100% 真实 IP 零泄露。

#### 🚀 快捷订阅 / 导入（Quantumult X）

复制以下原始链接直接导入到 Quantumult X 中使用：

```text
https://raw.githubusercontent.com/Niklaus88/QuantumultX_rule/main/QX-lrpz.conf
```

> **使用说明**：导入该公开模板后，请在 `[server_remote]` 模块中填入你自己的节点/机场订阅链接，并在 QX 设置中生成并信任你自己的 MitM 根证书即可正常使用。

#### 💡 关于 DNS 检测出现 “China / 中国服务器” 的特别说明

使用此配置访问 **[BrowserLeaks]**(https://browserleaks.com/dns)、**]IPPure]**(https://ippure.com/) 等隐私检测站时，DNS 列表中可能会看到中国联通/电信/移动等国内机房的 IP 记录。**这属于正常机制，绝非你的真实 IP 发生泄露**，无需担忧：

1. **核心原理**：本配置采用了阿里公共 DoH（`dns.alidns.com`）与腾讯公共 DoH（`doh.pub`）作为加密解析通道（兼顾国内流媒体极致的 CDN 就近加速）。检测站探测到的是**阿里/腾讯云端解析集群机房的公网出口 IP**，而非你本地设备的真实宽带 IP。
2. **核心判定标准**：
   - **真实出口安全**：检测站识别到的主访问 IP 始终为你的代理节点 IP（如美国、日本、香港等）。
   - **WebRTC 0 泄露**：WebRTC 检测项被完全阻断，本地内网 IP（`192.168.x.x`）与公网 IP 绝无暴露。
   - **传输强加密**：全链路均走 DoH（443 端口）HTTPS 强加密通道，本地运营商无法窥探或劫持你的具体解析域名。

---

### 2. 修复 iOS Notion 内嵌 YouTube 视频报 153 错误

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

## 📁 目录结构

```text
├── README.md                                 # 项目说明文档
├── QX-lrpz.conf                              # Quantumult X 懒人完美配置文件
├── Rewrite/
│   └── youtube_embed_referer.snippet         # QX 远程重写订阅配置文件
└── Scripts/
    └── youtube_embed_referer.js              # 请求头补全修复脚本
```

---

## ⚠️ 注意事项

- 本项目重写依赖 HTTPS 解密，请确保已在 Quantumult X 中正确生成、安装并**信任** MitM 根证书。
- 仅用于个人学习交流使用。
