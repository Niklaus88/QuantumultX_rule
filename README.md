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

## 📁 目录结构

```text
├── README.md                                 # 项目说明文档
├── Rewrite/
│   └── youtube_embed_referer.snippet         # QX 远程重写订阅配置文件
└── Scripts/
    └── youtube_embed_referer.js              # 请求头补全修复脚本
```

---

## ⚠️ 注意事项

- 本项目重写依赖 HTTPS 解密，请确保已在 Quantumult X 中正确生成、安装并**信任** MitM 根证书。
- 仅用于个人学习交流使用。
