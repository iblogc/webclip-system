# Web 收藏转 Markdown 系统

一个轻量化的网页收藏系统，支持一键收藏网页并自动转换为结构化的 Markdown 文件，包含 AI 摘要和标签。

## ✨ 特性

- 🌐 **浏览器一键收藏**: 通过油猴脚本在任何网页上一键收藏
- 📝 **自动 Markdown 转换**: 使用 Puppeteer + Readability 提取正文内容
- 🤖 **AI 智能摘要**: 支持 OpenAI 和 Gemini 生成摘要和标签（可开关）
- 📷 **图片资源下载**: 自动下载网络图片和转换 base64 图片为本地文件
- 🌐 **代理支持**: AI 调用和图片下载支持 HTTP 代理
- 📁 **分类管理**: 按分类自动整理文件
- 🔄 **Git 自动同步**: 自动提交并推送到 GitHub 仓库
- ⏰ **定时处理**: 支持 macOS 和 Windows 定时任务

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install

# 安装Chrome浏览器（Puppeteer需要）
npx puppeteer browsers install chrome
```

### 2. 配置系统

编辑 `config/config.json` 文件：

```json
{
  "gist_id": "你的Gist ID",
  "github_token": "你的GitHub Token",
  "output_dir": "~/Documents/KnowledgeRepo",
  "proxy": {
    "http_proxy": "http://127.0.0.1:7890",
    "https_proxy": "http://127.0.0.1:7890"
  },
  "ai": {
    "providers": [
      {
        "type": "openai",
        "api_key": "你的OpenAI API Key",
        "model": "gpt-3.5-turbo",
        "base_url": "https://api.openai.com/v1"
      }
    ]
  },
  "features": {
    "ai_summary": true,
    "download_resources": true
  },
  "resources": {
    "download_images": true,
    "download_timeout": 10,
    "max_file_size_mb": 10,
    "allowed_extensions": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    "assets_folder": "assets"
  }
}
```

**支持的 AI 服务**：

- OpenAI 官方 API
- DeepSeek API
- 阿里云通义千问
- 本地部署模型（Ollama 等）
- 任何兼容 OpenAI API 的服务

### 3. 运行设置向导

```bash
node setup.js
```

设置向导会帮你：

- 检查依赖项
- 验证配置文件
- 初始化 Git 仓库
- 设置定时任务

### 4. 安装浏览器脚本

1. 安装 Tampermonkey 浏览器扩展
2. 复制 `oilmonkey/clip-to-gist.user.js` 内容到 Tampermonkey
3. 保存脚本
4. 访问任意网页，点击 ⚙️ 配置按钮
5. 填写 Gist ID 和 GitHub Token
6. 完成配置后开始使用

**新特性**：

- 🎛️ **可视化配置**: 无需修改代码，通过界面配置
- 🎨 **界面自定义**: 按钮位置、大小、颜色可调
- ⚙️ **右键配置**: 右键点击按钮快速打开设置

### 5. 开始使用

1. 在任何网页上点击右下角的 📌 按钮
2. 填写分类和备注信息
3. 点击"确认收藏"
4. 系统会自动处理并生成 Markdown 文件

## 📂 项目结构

```
webclip-system/
├── oilmonkey/              # 浏览器脚本
│   └── clip-to-gist.user.js
├── config/                 # 配置文件
│   └── config.json
├── client/                 # 客户端处理器
│   ├── process_gist.js     # 主处理程序
│   ├── summarize.js        # AI摘要模块
│   ├── markdown-builder.js # Markdown构建器
│   ├── resource-downloader.js # 资源下载模块
│   ├── network-helper.js   # 网络请求助手
│   └── git-sync.js         # Git同步模块
├── launchd/               # macOS定时任务
│   └── com.webclip.processor.plist
├── setup.js               # 设置向导
└── README.md
```

## 🔧 配置说明

### GitHub 配置

1. 创建 GitHub Personal Access Token

   - 访问 GitHub Settings > Developer settings > Personal access tokens
   - 创建 token，需要 `gist` 权限

2. 创建私有 Gist
   - 访问 https://gist.github.com
   - 创建新的私有 Gist，文件名为 `webclip-queue.json`
   - 初始内容：`{"items":[]}`

### 代理配置

系统支持智能代理切换，优先直连，失败后自动切换代理重试：

```json
{
  "proxy": {
    "http_proxy": "http://127.0.0.1:7890",
    "https_proxy": "http://127.0.0.1:7890"
  }
}
```

**代理功能特点**：

- 🔄 **智能重试**: 优先直连，失败后自动切换代理
- 🌐 **全局支持**: AI 调用和图片下载都支持代理
- ⚡ **无缝切换**: 无需手动开关，自动选择最佳连接方式
- 🛡️ **容错机制**: 代理失败不影响整体功能

### AI 配置

支持多个 AI 提供商，按顺序尝试：

```json
{
  "ai": {
    "providers": [
      {
        "type": "openai",
        "api_key": "sk-...",
        "model": "gpt-3.5-turbo"
      },
      {
        "type": "gemini",
        "api_key": "AI...",
        "model": "gemini-pro"
      }
    ]
  }
}
```

### 功能开关配置

```json
{
  "features": {
    "ai_summary": true, // 是否启用AI摘要和标签生成
    "download_resources": true // 是否启用资源下载功能
  }
}
```

### 资源下载配置

```json
{
  "resources": {
    "download_images": true, // 是否下载图片
    "download_timeout": 10, // 下载超时时间（秒）
    "max_file_size_mb": 10, // 最大文件大小（MB）
    "allowed_extensions": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"], // 允许的文件扩展名
    "assets_folder": "assets" // 资源文件夹名称
  }
}
```

**资源下载功能说明**：

- 自动识别 Markdown 中的图片链接（HTTP URL 和 base64）
- 下载网络图片到本地 `assets/文章名/` 目录
- 转换 base64 图片为本地文件
- 自动替换 Markdown 中的图片引用为本地路径
- 支持代理下载
- 支持文件大小和类型限制
- 支持多种图片格式：JPG、PNG、GIF、WebP、SVG

## 📱 定时任务设置

### macOS (launchd)

```bash
# 加载任务
launchctl load ~/Library/LaunchAgents/com.webclip.processor.plist

# 启动任务
launchctl start com.webclip.processor

# 查看状态
launchctl list | grep webclip
```

### Windows (任务计划程序)

以管理员身份运行：

```cmd
schtasks /create /tn "WebClipProcessor" /tr "\"C:\path\to\node.exe\" \"C:\path\to\webclip-system\client\process_gist.js\"" /sc minute /mo 10 /f
```

## 📄 生成的 Markdown 格式

```markdown
---
title: 网页标题
url: https://example.com
created: 2025-07-25T15:22:00Z
category: 阅读
note: 可选备注
tags: [标签1, 标签2, 标签3]
summary: |
  AI自动摘要内容
---

## 正文内容

网页的主要内容...
```

## 🛠️ 手动运行

如果不想使用定时任务，可以手动运行：

```bash
# 处理一次队列
node client/process_gist.js

# 或者持续运行
npm start
```

## 🐛 故障排除

### 常见问题

1. **Puppeteer 安装失败**

   ```bash
   npm config set puppeteer_skip_chromium_download true
   npm install puppeteer
   ```

2. **权限错误**

   - 确保 GitHub Token 有正确的权限
   - 检查输出目录的写入权限

3. **网页抓取失败**
   - 某些网站可能有反爬虫机制
   - 检查网络连接和代理设置

### 日志查看

- macOS: `/tmp/webclip-processor.log`
- Windows: 任务计划程序中查看历史记录
- 错误文件: `输出目录/errors/`

## 📝 开发说明

### 添加新的 AI 提供商

1. 在 `client/summarize.js` 中创建新的 Provider 类
2. 实现 `summarize(content)` 方法
3. 在配置文件中添加对应配置

### 自定义 Markdown 转换

修改 `client/markdown-builder.js` 中的 Turndown 规则。

## 📄 许可证

MIT License

## 📚 相关文档

- [使用指南](USAGE.md) - 详细的配置和使用说明
- [脚本安装指南](SCRIPT_INSTALL.md) - 油猴脚本安装和配置详解
- [配置管理指南](CONFIG_MANAGEMENT.md) - 可视化配置功能详解
- [AI 配置指南](AI_CONFIG.md) - 支持多种 AI 服务的配置方法
- [项目完成总结](项目完成总结.md) - 完整功能清单和技术总结

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

_享受你的知识收藏之旅！_ 📚✨
