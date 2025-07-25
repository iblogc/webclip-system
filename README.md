# Web收藏转Markdown系统

一个轻量化的网页收藏系统，支持一键收藏网页并自动转换为结构化的Markdown文件，包含AI摘要和标签。

## ✨ 特性

- 🌐 **浏览器一键收藏**: 通过油猴脚本在任何网页上一键收藏
- 📝 **自动Markdown转换**: 使用Puppeteer + Readability提取正文内容
- 🤖 **AI智能摘要**: 支持OpenAI和Gemini生成摘要和标签（可开关）
- 📷 **图片资源下载**: 自动下载并本地化Markdown中的图片资源
- 🌐 **代理支持**: AI调用和图片下载支持HTTP代理
- 📁 **分类管理**: 按分类自动整理文件
- 🔄 **Git自动同步**: 自动提交并推送到GitHub仓库
- ⏰ **定时处理**: 支持macOS和Windows定时任务

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
  "ai": {
    "providers": [
      { 
        "type": "openai", 
        "api_key": "你的OpenAI API Key",
        "model": "gpt-3.5-turbo",
        "base_url": "https://api.openai.com/v1"
      }
    ],
    "proxy": {
      "enabled": false,
      "http_proxy": "http://127.0.0.1:7890",
      "https_proxy": "http://127.0.0.1:7890"
    }
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

**支持的AI服务**：
- OpenAI官方API
- DeepSeek API
- 阿里云通义千问
- 本地部署模型（Ollama等）
- 任何兼容OpenAI API的服务

### 3. 运行设置向导

```bash
node setup.js
```

设置向导会帮你：
- 检查依赖项
- 验证配置文件
- 初始化Git仓库
- 设置定时任务

### 4. 安装浏览器脚本

1. 安装Tampermonkey浏览器扩展
2. 复制 `oilmonkey/clip-to-gist.user.js` 内容到Tampermonkey
3. 保存脚本
4. 访问任意网页，点击⚙️配置按钮
5. 填写Gist ID和GitHub Token
6. 完成配置后开始使用

**新特性**：
- 🎛️ **可视化配置**: 无需修改代码，通过界面配置
- 🎨 **界面自定义**: 按钮位置、大小、颜色可调
- ⚙️ **右键配置**: 右键点击按钮快速打开设置

### 5. 开始使用

1. 在任何网页上点击右下角的📌按钮
2. 填写分类和备注信息
3. 点击"确认收藏"
4. 系统会自动处理并生成Markdown文件

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
│   └── git-sync.js         # Git同步模块
├── launchd/               # macOS定时任务
│   └── com.webclip.processor.plist
├── setup.js               # 设置向导
└── README.md
```

## 🔧 配置说明

### GitHub配置

1. 创建GitHub Personal Access Token
   - 访问 GitHub Settings > Developer settings > Personal access tokens
   - 创建token，需要 `gist` 权限

2. 创建私有Gist
   - 访问 https://gist.github.com
   - 创建新的私有Gist，文件名为 `webclip-queue.json`
   - 初始内容：`{"items":[]}`

### AI配置

支持多个AI提供商，按顺序尝试：

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
    ],
    "proxy": {
      "enabled": true,
      "http_proxy": "http://127.0.0.1:7890",
      "https_proxy": "http://127.0.0.1:7890"
    }
  }
}
```

### 功能开关配置

```json
{
  "features": {
    "ai_summary": true,        // 是否启用AI摘要和标签生成
    "download_resources": true // 是否启用资源下载功能
  }
}
```

### 资源下载配置

```json
{
  "resources": {
    "download_images": true,                                    // 是否下载图片
    "download_timeout": 10,                                     // 下载超时时间（秒）
    "max_file_size_mb": 10,                                     // 最大文件大小（MB）
    "allowed_extensions": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"], // 允许的文件扩展名
    "assets_folder": "assets"                                   // 资源文件夹名称
  }
}
```

**资源下载功能说明**：
- 自动识别Markdown中的图片链接
- 下载图片到本地 `assets/文章名/` 目录
- 自动替换Markdown中的图片引用为本地路径
- 支持代理下载
- 支持文件大小和类型限制

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

## 📄 生成的Markdown格式

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

1. **Puppeteer安装失败**
   ```bash
   npm config set puppeteer_skip_chromium_download true
   npm install puppeteer
   ```

2. **权限错误**
   - 确保GitHub Token有正确的权限
   - 检查输出目录的写入权限

3. **网页抓取失败**
   - 某些网站可能有反爬虫机制
   - 检查网络连接和代理设置

### 日志查看

- macOS: `/tmp/webclip-processor.log`
- Windows: 任务计划程序中查看历史记录
- 错误文件: `输出目录/errors/`

## 📝 开发说明

### 添加新的AI提供商

1. 在 `client/summarize.js` 中创建新的Provider类
2. 实现 `summarize(content)` 方法
3. 在配置文件中添加对应配置

### 自定义Markdown转换

修改 `client/markdown-builder.js` 中的Turndown规则。

## 📄 许可证

MIT License

## 📚 相关文档

- [使用指南](USAGE.md) - 详细的配置和使用说明
- [脚本安装指南](SCRIPT_INSTALL.md) - 油猴脚本安装和配置详解
- [配置管理指南](CONFIG_MANAGEMENT.md) - 可视化配置功能详解
- [AI配置指南](AI_CONFIG.md) - 支持多种AI服务的配置方法
- [项目完成总结](项目完成总结.md) - 完整功能清单和技术总结

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

*享受你的知识收藏之旅！* 📚✨