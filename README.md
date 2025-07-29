# Web 收藏转 Markdown 系统

一个轻量化的网页收藏系统，支持一键收藏网页并自动转换为结构化的 Markdown 文件，包含 AI 摘要和标签。

## ✨ 特性

- 🌐 **浏览器一键收藏**: 通过油猴脚本在任何网页上一键收藏
- 📝 **自动 Markdown 转换**: 使用 Puppeteer + Readability 提取正文内容
- 🤖 **AI 智能摘要**: 支持多种 AI 服务生成摘要和标签，支持 API 密钥轮换（可开关）
- 📷 **图片资源下载**: 自动下载网络图片和转换 base64 图片为本地文件
- 🌐 **代理支持**: AI 调用和图片下载支持 HTTP 代理
- 📁 **分类管理**: 按分类自动整理文件
- 🔄 **Git 自动同步**: 自动提交并推送到 GitHub 仓库
- ⏰ **定时处理**: 支持 macOS 和 Windows 定时任务

## 🚀 快速开始

### 部署方式选择

**方式一：GitHub Actions部署（推荐）**
- ✅ 完全在线运行，无需本地环境
- ✅ 自动定时处理，无需手动维护
- ✅ 免费使用（公开仓库）
- ✅ 支持邮件通知和自动清理

**方式二：本地部署**
- 需要本地Node.js环境
- 需要配置定时任务
- 适合高度自定义需求

### GitHub Actions部署（推荐）

详细部署指南请参考：[GitHub Actions部署指南](docs/GITHUB_ACTIONS_SETUP.md)

**快速步骤**：
1. Fork此仓库到你的GitHub账号
2. 创建私有仓库存储结果
3. 配置GitHub Secrets（包括AI服务配置）
4. 启用Actions工作流

> 🔧 **AI服务配置**：支持多种AI服务和API密钥轮换，详见 [AI服务提供商配置指南](docs/AI_PROVIDERS_CONFIG.md)

#### 必需配置的Secrets

**基础配置**：
```
GIST_ID                 # GitHub Gist ID
TOKEN                   # GitHub访问令牌
TARGET_REPO            # 目标私有仓库 (username/repo-name)
```

**AI服务配置**（至少配置一个）：
```
# OpenAI（支持多个API密钥，逗号分隔）
OPENAI_API_KEY         # sk-key1,sk-key2,sk-key3
OPENAI_MODEL           # gpt-3.5-turbo (可选)
OPENAI_BASE_URL        # https://api.openai.com/v1 (可选)

# Gemini（支持多个API密钥，逗号分隔）
GEMINI_API_KEY         # AIzaSy-key1,AIzaSy-key2
GEMINI_MODEL           # gemini-2.0-flash (可选)
GEMINI_BASE_URL        # https://generativelanguage.googleapis.com (可选)

# 自定义AI配置（JSON格式）
CUSTOM_AI_CONFIG       # [{"type":"openai","api_key":"sk-xxx","model":"gpt-4","base_url":"https://api.deepseek.com/v1"}]
```

> 💡 **详细AI配置指南**：[AI服务提供商配置指南](docs/AI_PROVIDERS_CONFIG.md)  
> 支持OpenAI、Gemini、DeepSeek、通义千问、Kimi等多种AI服务，包含多API密钥轮换、故障转移等高级功能。

**可选配置**：
```
CRON_EXPRESSION        # */15 * * * * (定时运行)
ENABLE_AI_SUMMARY      # true/false (启用AI摘要)
ENABLE_RESOURCE_DOWNLOAD # true/false (启用资源下载)
HTTP_PROXY             # 代理设置
HTTPS_PROXY            # 代理设置
NOTIFICATION_EMAIL     # 邮件通知
EMAIL_SMTP_HOST        # 邮件服务器
EMAIL_SMTP_PORT        # 邮件端口
EMAIL_USER             # 邮件用户名
EMAIL_PASS             # 邮件密码
```

### 本地部署

#### 1. 安装依赖

```bash
npm install

# 安装Chrome浏览器（Puppeteer需要）
npx puppeteer browsers install chrome
```

#### 2. 配置系统

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

#### 3. 运行设置向导

```bash
node setup.js
```

设置向导会帮你：

- 检查依赖项
- 验证配置文件
- 初始化 Git 仓库
- 设置定时任务

## 📱 浏览器脚本安装

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

## 📝 开始使用

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
├── .github/workflows/      # GitHub Actions工作流
│   └── webclip-processor.yml
├── scripts/                # Actions脚本
│   ├── setup-config.js     # 动态配置生成
│   ├── actions-processor.js # Actions处理器
│   ├── push-to-target.js   # 推送到目标仓库
│   ├── send-notification.js # 邮件通知
│   └── cleanup-workflows.js # 清理旧工作流
├── client/                 # 客户端处理器
│   ├── process_gist.js     # 主处理程序
│   ├── summarize.js        # AI摘要模块
│   ├── markdown-builder.js # Markdown构建器
│   ├── resource-downloader.js # 资源下载模块
│   ├── network-helper.js   # 网络请求助手
│   └── git-sync.js         # Git同步模块
├── docs/                   # 文档
│   ├── GITHUB_ACTIONS_SETUP.md # Actions部署指南
│   └── AI_PROVIDERS_CONFIG.md  # AI服务配置指南
├── launchd/               # macOS定时任务
│   └── com.webclip.processor.plist
├── setup.js               # 设置向导
└── README.md
```

## 🔧 详细配置

详细的配置说明请参考：
- [GitHub Actions部署指南](docs/GITHUB_ACTIONS_SETUP.md) - 云端部署配置
- [AI服务配置指南](docs/AI_PROVIDERS_CONFIG.md) - AI服务和API密钥配置

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

常见问题和解决方案请参考：[GitHub Actions部署指南](docs/GITHUB_ACTIONS_SETUP.md#故障排除)

## 📄 许可证

MIT License

## 📚 相关文档

- [GitHub Actions部署指南](docs/GITHUB_ACTIONS_SETUP.md) - 完整的云端部署指南
- [AI服务配置指南](docs/AI_PROVIDERS_CONFIG.md) - 多AI服务配置和API密钥管理
- [项目总结](docs/PROJECT_SUMMARY.md) - 完整功能清单和技术总结

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

_享受你的知识收藏之旅！_ 📚✨
